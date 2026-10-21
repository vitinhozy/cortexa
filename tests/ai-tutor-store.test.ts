import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { supabaseTutorBackend } from '../supabase/functions/_shared/ai/tutorStore';

const owner = '5d6c8d34-b844-4ebc-ae2a-26e390d98346';
test('tutor usage migration enforces atomic daily claims and stores no conversation content', async (t) => {
  const { PGlite } = await import('@electric-sql/pglite');
  const db = await PGlite.create();
  t.after(() => db.close());
  await db.exec(
    'create role anon; create role authenticated; create role service_role bypassrls; ' +
      'create schema auth; create table auth.users(id uuid primary key); ' +
      'grant usage on schema public, auth to authenticated, anon, service_role;',
  );
  await db.query('insert into auth.users values ($1)', [owner]);
  await db.exec(await readFile('supabase/migrations/20261021142323_ai_tutor_chat.sql', 'utf8'));
  const send: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    const authorization = new Headers(init?.headers).get('Authorization');
    if (url.pathname === '/auth/v1/user') {
      if (authorization === 'Bearer user-token')
        return Response.json({ id: owner, is_anonymous: false });
      if (authorization === 'Bearer anonymous-token')
        return Response.json({ id: owner, is_anonymous: true });
      return Response.json({}, { status: 401 });
    }
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    const names: Record<string, string[]> = {
      claim_ai_tutor_chat: ['p_owner', 'p_request_id', 'p_provider', 'p_model', 'p_daily_limit'],
      finish_ai_tutor_chat: ['p_owner', 'p_request_id', 'p_usage', 'p_error'],
    };
    const functionName = url.pathname.split('/').at(-1)!;
    const values = (names[functionName] ?? []).map((name) => body[name]);
    const result = await db.transaction(async (tx) => {
      await tx.exec('set local role service_role');
      return tx.query<{ result: unknown }>(
        'select public.' +
          functionName +
          '(' +
          values.map((_, index) => '$' + (index + 1)).join(',') +
          ') as result',
        values,
      );
    });
    return Response.json(result.rows[0].result);
  };
  const backend = supabaseTutorBackend(
    'https://database.test',
    'server-role-key',
    {
      model: 'gemini-3.8-flash',
      timeoutMs: 1000,
      maxOutputTokens: 2048,
      dailyLimit: 20,
      dailyTutorLimit: 1,
    },
    send,
  );
  assert.equal(await backend.store.authenticate('user-token'), owner);
  await assert.rejects(backend.store.authenticate('anonymous-token'));
  const requestId = 'c144ee68-b8b4-45d0-9f1b-33ec42fd72a3';
  assert.equal(
    await backend.store.claim(owner, requestId, 'gemini', 'gemini-3.8-flash', 1),
    'claimed',
  );
  await backend.store.finish(owner, requestId, {
    requestId,
    userId: owner,
    feature: 'tutor-chat',
    task: 'tutoring',
    provider: 'gemini',
    model: 'gemini-3.8-flash',
    latencyMs: 123,
    inputTokens: 30,
    outputTokens: 15,
    timestamp: new Date().toISOString(),
    status: 'completed',
  });
  assert.equal(
    await backend.store.claim(
      owner,
      '5f79871f-1598-40f8-b2fd-39edce875c63',
      'gemini',
      'gemini-3.8-flash',
      1,
    ),
    'limited',
  );
  const usage = await db.query('select * from public.ai_chat_usage');
  assert.equal(usage.rows.length, 1);
  assert.equal(JSON.stringify(usage.rows).includes('Pergunta privada'), false);
  await assert.rejects(
    db.transaction(async (tx) => {
      await tx.exec('set local role authenticated');
      await tx.query('select * from public.ai_chat_usage');
    }),
  );
});
