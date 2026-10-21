import { readFile } from 'node:fs/promises';
import { aiConfig } from '../../supabase/functions/_shared/ai/config';
import { geminiProvider } from '../../supabase/functions/_shared/ai/gemini';
import { analysisHandler } from '../../supabase/functions/_shared/ai/handler';
import { supabaseAnalysisBackend } from '../../supabase/functions/_shared/ai/supabaseStore';
import type { MaterialAnalysis, MaterialAnalysisTransport } from '../../types/materialAnalysis';
import { remoteAIError } from '../../services/aiErrors';

export const ownerA = '11111111-1111-4111-8111-111111111111';
export const ownerB = '22222222-2222-4222-8222-222222222222';
export const sourceText =
  'Conceito Alfa faz parte deste material. Conceito Beta depende do conceito Alfa.';
export const sampleAnalysis = (): MaterialAnalysis => ({
  schemaVersion: 1,
  status: 'analyzed',
  discipline: 'Estudo de exemplo',
  theme: 'Material de teste',
  topics: ['Conceitos'],
  complexity: 'basic',
  learningObjectives: ['Relacionar Alfa e Beta'],
  concepts: [
    {
      name: 'Alfa',
      description: 'Primeiro conceito do material.',
      evidenceQuote: 'Conceito Alfa faz parte deste material.',
      important: true,
      prerequisites: [],
    },
    {
      name: 'Beta',
      description: 'Segundo conceito do material.',
      evidenceQuote: 'Conceito Beta depende do conceito Alfa.',
      important: false,
      prerequisites: ['Alfa'],
    },
  ],
  limitations: ['Texto sintético usado exclusivamente em testes.'],
});
export const geminiResponse = (output: unknown = sampleAnalysis(), finishReason = 'STOP') =>
  Response.json({
    candidates: [{ finishReason, content: { parts: [{ text: JSON.stringify(output) }] } }],
    usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 80, thoughtsTokenCount: 10 },
  });

export async function analysisHarness(dailyLimit = 20) {
  const { PGlite } = await import('@electric-sql/pglite');
  const db = await PGlite.create();
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key);
    insert into auth.users values ('${ownerA}'), ('${ownerB}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema public, auth to authenticated, anon, service_role;
    grant execute on function auth.uid() to authenticated;
  `);
  await db.exec(
    await readFile('supabase/migrations/20261020005809_cortexa_ai_material_analysis.sql', 'utf8'),
  );
  const state = {
    calls: 0,
    output: sampleAnalysis() as unknown,
    wait: undefined as Promise<void> | undefined,
    requestBody: undefined as unknown,
  };
  const config = {
    ...aiConfig((key) => (key === 'GEMINI_API_KEY' ? 'test-only-key' : undefined)),
    dailyLimit,
  };
  const send: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    const headers = new Headers(init?.headers);
    if (url.hostname === 'generativelanguage.googleapis.com') {
      state.calls++;
      state.requestBody = JSON.parse(String(init?.body));
      if (state.wait) await state.wait;
      return geminiResponse(state.output);
    }
    if (url.pathname === '/auth/v1/user') {
      const token = headers.get('Authorization');
      return token === 'Bearer token-a' || token === 'Bearer token-b'
        ? Response.json({ id: token === 'Bearer token-a' ? ownerA : ownerB })
        : Response.json({}, { status: 401 });
    }
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    const name = url.pathname.split('/').at(-1)!;
    const parameters: Record<string, string[]> = {
      claim_material_analysis: [
        'p_owner',
        'p_key',
        'p_material',
        'p_hash',
        'p_model',
        'p_prompt',
        'p_daily_limit',
      ],
      finish_material_analysis: ['p_owner', 'p_key', 'p_token', 'p_record', 'p_usage', 'p_error'],
      review_material_analysis: ['p_owner', 'p_key'],
    };
    if (!parameters[name]) throw new Error('Unexpected endpoint');
    const values = parameters[name].map((key) => body[key]);
    const result = await db.transaction(async (tx) => {
      await tx.exec('set local role service_role');
      return tx.query<{ result: unknown }>(
        `select public.${name}(${values.map((_, i) => `$${i + 1}`).join(',')}) as result`,
        values,
      );
    });
    return Response.json(result.rows[0].result);
  };
  const handler = analysisHandler({
    ...supabaseAnalysisBackend('https://database.test', 'server-only-test-key', send),
    config,
    provider: geminiProvider(config, send),
  });
  const request = (body: unknown, token = 'token-a', signal?: AbortSignal) =>
    handler(
      new Request('https://database.test/functions/v1/ai-material-analysis', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal,
      }),
    );
  const transport: MaterialAnalysisTransport = {
    async analyze(owner, material, signal) {
      const response = await request(
        { operation: 'analyze', material },
        owner === ownerA ? 'token-a' : 'token-b',
        signal,
      );
      const value = await response.json();
      if (!response.ok) throw remoteAIError(value);
      return value.record;
    },
    async review(owner, id, signal) {
      const response = await request(
        { operation: 'review', id },
        owner === ownerA ? 'token-a' : 'token-b',
        signal,
      );
      const value = await response.json();
      if (!response.ok) throw remoteAIError(value);
      return value.record;
    },
  };
  return { db, state, handler, request, transport, config };
}
