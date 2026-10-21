-- Guarda somente metadados de uso. Texto de perguntas, histórico e respostas nunca é persistido.
create table public.ai_chat_usage (
  request_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  model text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  latency_ms integer check (latency_ms >= 0),
  input_tokens integer check (input_tokens >= 0),
  output_tokens integer check (output_tokens >= 0),
  status text not null check (status in ('running', 'completed', 'failed')),
  error_code text
);
create index ai_chat_usage_user_started on public.ai_chat_usage(user_id, started_at desc);
alter table public.ai_chat_usage enable row level security;
revoke all on public.ai_chat_usage from public, anon, authenticated;
grant all on public.ai_chat_usage to service_role;

create function public.claim_ai_tutor_chat(
  p_owner uuid,
  p_request_id uuid,
  p_provider text,
  p_model text,
  p_daily_limit integer
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_daily_limit not between 1 and 100 then raise exception 'invalid limit'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_owner::text, 0));
  if (
    select count(*) from public.ai_chat_usage
    where user_id = p_owner and started_at >= now() - interval '24 hours'
  ) >= p_daily_limit then
    return 'limited';
  end if;
  insert into public.ai_chat_usage(request_id, user_id, provider, model, status)
  values (p_request_id, p_owner, p_provider, p_model, 'running');
  return 'claimed';
end;
$$;

create function public.finish_ai_tutor_chat(
  p_owner uuid,
  p_request_id uuid,
  p_usage jsonb,
  p_error text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  next_status text := case when p_error is null then 'completed' else 'failed' end;
  v_input_tokens integer;
  v_output_tokens integer;
  v_latency integer;
begin
  if jsonb_typeof(p_usage) <> 'object' then return false; end if;
  begin
    v_input_tokens := nullif(p_usage->>'inputTokens', '')::integer;
    v_output_tokens := nullif(p_usage->>'outputTokens', '')::integer;
    v_latency := nullif(p_usage->>'latencyMs', '')::integer;
  exception when others then
    return false;
  end;
  if v_input_tokens < 0 or v_output_tokens < 0 or v_latency < 0 then return false; end if;
  update public.ai_chat_usage
  set finished_at = now(),
      latency_ms = v_latency,
      input_tokens = v_input_tokens,
      output_tokens = v_output_tokens,
      status = next_status,
      error_code = p_error
  where request_id = p_request_id and user_id = p_owner and status = 'running';
  return found;
end;
$$;

revoke all on function public.claim_ai_tutor_chat(uuid, uuid, text, text, integer) from public, anon, authenticated;
revoke all on function public.finish_ai_tutor_chat(uuid, uuid, jsonb, text) from public, anon, authenticated;
grant execute on function public.claim_ai_tutor_chat(uuid, uuid, text, text, integer) to service_role;
grant execute on function public.finish_ai_tutor_chat(uuid, uuid, jsonb, text) to service_role;
