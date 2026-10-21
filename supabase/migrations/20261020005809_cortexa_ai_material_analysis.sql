-- Server writes only; authenticated users can read their own provenance and drafts.
create table public.ai_material_versions (
  user_id uuid not null references auth.users(id) on delete cascade,
  material_id text not null check (length(material_id) between 1 and 150),
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  title text not null check (length(title) between 1 and 100),
  content text not null check (length(content) between 1 and 10000),
  subject_name text not null,
  topic_name text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, material_id, content_hash)
);
create table public.ai_material_analyses (
  user_id uuid not null,
  cache_key text not null check (cache_key ~ '^[a-f0-9]{64}$'),
  material_id text not null,
  content_hash text not null,
  model text not null,
  prompt_version text not null,
  status text not null check (status in ('running', 'completed', 'failed')),
  lease_token uuid not null,
  updated_at timestamptz not null default now(),
  result jsonb,
  reviewed_at timestamptz,
  primary key (user_id, cache_key),
  foreign key (user_id, material_id, content_hash) references public.ai_material_versions(user_id, material_id, content_hash) on delete cascade,
  check ((status = 'completed' and result is not null) or (status <> 'completed' and result is null))
);
create table public.ai_usage (
  request_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  cache_key text not null,
  task text not null default 'extraction',
  feature text not null default 'material-analysis',
  provider text not null default 'gemini',
  model text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  latency_ms integer check (latency_ms >= 0),
  input_tokens integer check (input_tokens >= 0),
  output_tokens integer check (output_tokens >= 0),
  reasoning_tokens integer check (reasoning_tokens >= 0),
  status text not null check (status in ('running', 'completed', 'failed')),
  error_code text,
  foreign key (user_id, cache_key) references public.ai_material_analyses(user_id, cache_key) on delete cascade
);
create index ai_usage_user_started on public.ai_usage(user_id, started_at desc);
create index ai_analyses_material on public.ai_material_analyses(user_id, material_id, content_hash);
alter table public.ai_material_versions enable row level security;
alter table public.ai_material_analyses enable row level security;
alter table public.ai_usage enable row level security;
revoke all on public.ai_material_versions, public.ai_material_analyses, public.ai_usage from public, anon, authenticated;
grant select on public.ai_material_versions, public.ai_material_analyses, public.ai_usage to authenticated;
grant all on public.ai_material_versions, public.ai_material_analyses, public.ai_usage to service_role;
create policy own_material_versions on public.ai_material_versions for select to authenticated using ((select auth.uid()) = user_id);
create policy own_material_analyses on public.ai_material_analyses for select to authenticated using ((select auth.uid()) = user_id);
create policy own_ai_usage on public.ai_usage for select to authenticated using ((select auth.uid()) = user_id);

-- Invoker permissions: only service_role can execute. Never callable with a client key.
create function public.claim_material_analysis(p_owner uuid, p_key text, p_material jsonb, p_hash text, p_model text, p_prompt text, p_daily_limit integer)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare existing public.ai_material_analyses%rowtype; token uuid := gen_random_uuid();
begin
  if p_daily_limit not between 1 and 100 then raise exception 'invalid limit'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_owner::text, 0));
  select * into existing from public.ai_material_analyses where user_id = p_owner and cache_key = p_key;
  if existing.status = 'completed' then
    return jsonb_build_object('state', 'cached', 'record', existing.result || case when existing.reviewed_at is null then '{}'::jsonb else jsonb_build_object('reviewedAt', existing.reviewed_at) end);
  end if;
  if existing.status = 'running' and existing.updated_at > now() - interval '2 minutes' then
    return jsonb_build_object('state', 'busy');
  end if;
  if (select count(*) from public.ai_usage where user_id = p_owner and started_at >= now() - interval '24 hours') >= p_daily_limit then
    return jsonb_build_object('state', 'limited');
  end if;
  if existing.status = 'running' then
    update public.ai_usage set status = 'failed', error_code = 'timeout', finished_at = now() where request_id = existing.lease_token and status = 'running';
  end if;
  insert into public.ai_material_versions(user_id, material_id, content_hash, title, content, subject_name, topic_name)
    values(p_owner, p_material->>'id', p_hash, p_material->>'title', p_material->>'content', p_material->>'subjectName', p_material->>'topicName')
    on conflict do nothing;
  insert into public.ai_material_analyses(user_id, cache_key, material_id, content_hash, model, prompt_version, status, lease_token)
    values(p_owner, p_key, p_material->>'id', p_hash, p_model, p_prompt, 'running', token)
    on conflict(user_id, cache_key) do update set status = 'running', lease_token = token, updated_at = now(), result = null, reviewed_at = null;
  insert into public.ai_usage(request_id, user_id, cache_key, model, status) values(token, p_owner, p_key, p_model, 'running');
  return jsonb_build_object('state', 'claimed', 'token', token);
end;
$$;
create function public.finish_material_analysis(p_owner uuid, p_key text, p_token uuid, p_record jsonb, p_usage jsonb, p_error text)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare existing public.ai_material_analyses%rowtype;
begin
  select * into existing from public.ai_material_analyses where user_id = p_owner and cache_key = p_key for update;
  if existing.lease_token is distinct from p_token then return false; end if;
  if existing.status <> 'running' then return true; end if;
  if p_record is not null and (
    p_record->>'userId' is distinct from p_owner::text or p_record->>'id' is distinct from p_key or
    p_record->>'materialId' is distinct from existing.material_id or p_record->>'contentHash' is distinct from existing.content_hash or
    p_record->'analysis'->>'schemaVersion' is distinct from '1'
  ) then raise exception 'invalid provenance'; end if;
  update public.ai_material_analyses set status = case when p_record is null then 'failed' else 'completed' end,
    result = p_record, updated_at = now() where user_id = p_owner and cache_key = p_key;
  update public.ai_usage set status = case when p_record is null then 'failed' else 'completed' end,
    finished_at = now(), latency_ms = coalesce((p_usage->>'latencyMs')::integer, greatest(0, extract(epoch from (now() - started_at)) * 1000)::integer),
    input_tokens = (p_usage->>'inputTokens')::integer, output_tokens = (p_usage->>'outputTokens')::integer,
    reasoning_tokens = (p_usage->>'reasoningTokens')::integer, error_code = p_error
    where request_id = p_token and user_id = p_owner;
  return true;
end;
$$;
create function public.review_material_analysis(p_owner uuid, p_key text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare output jsonb;
begin
  update public.ai_material_analyses set reviewed_at = coalesce(reviewed_at, now())
    where user_id = p_owner and cache_key = p_key and status = 'completed' and result->'analysis'->>'status' = 'analyzed'
    returning result || jsonb_build_object('reviewedAt', reviewed_at) into output;
  return output;
end;
$$;
revoke all on function public.claim_material_analysis(uuid, text, jsonb, text, text, text, integer) from public, anon, authenticated;
revoke all on function public.finish_material_analysis(uuid, text, uuid, jsonb, jsonb, text) from public, anon, authenticated;
revoke all on function public.review_material_analysis(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_material_analysis(uuid, text, jsonb, text, text, text, integer) to service_role;
grant execute on function public.finish_material_analysis(uuid, text, uuid, jsonb, jsonb, text) to service_role;
grant execute on function public.review_material_analysis(uuid, text) to service_role;
