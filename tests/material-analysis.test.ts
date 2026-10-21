import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analysisHarness,
  geminiResponse,
  ownerA,
  ownerB,
  sampleAnalysis,
  sourceText,
} from './helpers/analysisHarness';
import { parseMaterialAnalysis } from '../features/study/materialAnalysisSchema';
import { LocalRepository } from '../services/repository';
import { createPersonalWorkspace } from '../services/personalWorkspace';
import { createServices } from '../services';
import { analysisSource } from '../services/materialAnalysis';
import { learnerModel } from '../features/study/learner';
import { geminiProvider } from '../supabase/functions/_shared/ai/gemini';
import { aiConfig } from '../supabase/functions/_shared/ai/config';
import type { AIModel, AIRequest } from '../types/ai';

test('material schema rejects fabricated evidence, duplicate concepts, cycles and malformed structure', () => {
  assert.deepEqual(parseMaterialAnalysis(sampleAnalysis(), sourceText), sampleAnalysis());
  const cases = [
    { ...sampleAnalysis(), externalReferences: ['invented'] },
    { ...sampleAnalysis(), concepts: [] },
    { ...sampleAnalysis(), status: 'insufficient' },
    {
      ...sampleAnalysis(),
      concepts: [{ ...sampleAnalysis().concepts[0], evidenceQuote: 'Não existe na fonte.' }],
    },
    { ...sampleAnalysis(), concepts: [sampleAnalysis().concepts[0], sampleAnalysis().concepts[0]] },
    {
      ...sampleAnalysis(),
      concepts: [{ ...sampleAnalysis().concepts[0], prerequisites: ['Desconhecido'] }],
    },
    {
      ...sampleAnalysis(),
      concepts: [
        { ...sampleAnalysis().concepts[0], prerequisites: ['Beta'] },
        sampleAnalysis().concepts[1],
      ],
    },
  ];
  for (const value of cases) assert.throws(() => parseMaterialAnalysis(value, sourceText));
  assert.equal(
    parseMaterialAnalysis({ ...sampleAnalysis(), status: 'insufficient', concepts: [] }, sourceText)
      .status,
    'insufficient',
  );
});

test('server to local repository: grounded draft, persistent cache, review, concept links and unchanged mastery', async (t) => {
  const h = await analysisHarness();
  t.after(() => h.db.close());
  const repo = new LocalRepository(() => createPersonalWorkspace(ownerA), 'analysis-test');
  let stored = '';
  const storage = {
    getItem: async () => stored || null,
    setItem: async (_: string, value: string) => {
      stored = value;
    },
  };
  await repo.hydrate(storage);
  const services = createServices(repo, { materialAnalysisTransport: h.transport });
  const material = await services.materialService.addNote('Anotação de teste', sourceText);
  const before = structuredClone(repo.getSnapshot().metrics);
  const record = await services.materialAnalysisService.analyze(material.id);
  assert.equal(h.state.calls, 1);
  assert.equal(repo.getSnapshot().learning?.concepts.length, 0);
  assert.equal(repo.getSnapshot().materials[0].analysis, undefined);
  const again = await services.materialAnalysisService.analyze(material.id);
  assert.equal(again.id, record.id);
  assert.equal(h.state.calls, 1);
  await services.materialAnalysisService.approve(material.id, record);
  await services.materialAnalysisService.approve(material.id, record);
  await repo.flush();
  assert.deepEqual(repo.getSnapshot().metrics, before);
  assert.equal(
    repo.getSnapshot().learning?.events.filter((e) => e.type === 'MATERIAL_ANALYSIS_REVIEWED')
      .length,
    1,
  );
  assert.equal(repo.getSnapshot().learning?.relations.length, 1);
  const model = learnerModel(repo.getSnapshot());
  assert.equal(model.concepts.length, 2);
  assert.ok(
    model.concepts.every(
      (c) =>
        c.exposureCount === 0 && c.mastery.exposures === 0 && c.sourceIds.includes(material.id),
    ),
  );
  const restored = new LocalRepository(() => createPersonalWorkspace(ownerA), 'analysis-test');
  await restored.hydrate(storage);
  assert.equal(restored.storageError, false);
  assert.equal(restored.getSnapshot().materials[0].analysis?.record.id, record.id);
  const usage = await h.db.query<{ status: string; input_tokens: number; output_tokens: number }>(
    'select * from public.ai_usage',
  );
  assert.equal(usage.rows.length, 1);
  assert.equal(usage.rows[0].status, 'completed');
  assert.equal(usage.rows[0].input_tokens, 100);
  assert.equal(usage.rows[0].output_tokens, 80);
  assert.equal(JSON.stringify(usage.rows).includes(sourceText), false);
  assert.equal(JSON.stringify(usage.rows).includes('test-only-key'), false);
  const ownSource = analysisSource(repo.getSnapshot(), material.id);
  const secondOwner = await h.transport.analyze(ownerB, ownSource);
  assert.equal(h.state.calls, 2);
  assert.equal((secondOwner as { userId: string }).userId, ownerB);
  // A changed revision must not reuse the old analysis or silently mutate saved concepts.
  repo.update((data) => ({
    ...data,
    materials: data.materials.map((m) => ({ ...m, title: 'Título revisado' })),
  }));
  await assert.rejects(services.materialAnalysisService.approve(material.id, record));
  const changed = await services.materialAnalysisService.analyze(material.id);
  assert.notEqual(changed.id, record.id);
  assert.equal(h.state.calls, 3);
  await services.materialAnalysisService.approve(material.id, changed);
  assert.equal(repo.getSnapshot().learning?.concepts.length, 2);
  assert.deepEqual(repo.getSnapshot().metrics, before);
  // Corrupt provenance cannot be rehydrated into the current user's workspace.
  const corrupted = JSON.parse(stored);
  corrupted.materials[0].analysis.record.userId = ownerB;
  const blocked = new LocalRepository(() => createPersonalWorkspace(ownerA));
  await blocked.hydrate({
    getItem: async () => JSON.stringify(corrupted),
    setItem: async () => assert.fail('must not overwrite'),
  });
  assert.equal(blocked.storageError, true);
});

test('Postgres policies block other owners, unauthenticated reads and direct generation writes', async (t) => {
  const h = await analysisHarness();
  t.after(() => h.db.close());
  const material = {
    id: 'note',
    title: 'Teste',
    content: sourceText,
    subjectName: 'Estudo',
    topicName: 'Conceitos',
  };
  const response = await h.request({ operation: 'analyze', material });
  assert.equal(response.status, 200);
  const { record } = await response.json();
  assert.equal((await h.request({ operation: 'review', id: record.id }, 'token-b')).status, 400);
  assert.equal((await h.request({ operation: 'analyze', material, userId: ownerB })).status, 400);
  assert.equal((await h.request({ operation: 'analyze', material }, 'expired')).status, 401);
  assert.equal(h.state.calls, 1);
  for (const [owner, count] of [
    [ownerA, 1],
    [ownerB, 0],
  ] as const) {
    await h.db.transaction(async (tx) => {
      await tx.exec('set local role authenticated');
      await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [owner]);
      for (const table of ['ai_material_versions', 'ai_material_analyses', 'ai_usage']) {
        const result = await tx.query(`select * from public.${table}`);
        assert.equal(result.rows.length, count);
      }
    });
  }
  await assert.rejects(
    h.db.transaction(async (tx) => {
      await tx.exec('set local role authenticated');
      await tx.query('select public.review_material_analysis($1, $2)', [ownerA, record.id]);
    }),
    /permission denied/,
  );
  await assert.rejects(
    h.db.transaction(async (tx) => {
      await tx.exec('set local role authenticated');
      await tx.exec("update public.ai_material_analyses set status = 'completed'");
    }),
    /permission denied/,
  );
  await assert.rejects(
    h.db.transaction(async (tx) => {
      await tx.exec('set local role anon');
      await tx.exec('select * from public.ai_material_versions');
    }),
    /permission denied/,
  );
  await assert.rejects(
    h.db.query(
      `insert into public.ai_material_analyses(user_id,cache_key,material_id,content_hash,model,prompt_version,status,lease_token) values($1,$2,'note',$3,'model','v1','running',gen_random_uuid())`,
      [ownerB, 'a'.repeat(64), record.contentHash],
    ),
    /foreign key/,
  );
});

test('concurrent requests share a lease, failures keep real usage and the daily budget is enforced', async (t) => {
  const h = await analysisHarness(2);
  t.after(() => h.db.close());
  const material = {
    id: 'note',
    title: 'Teste',
    content: sourceText,
    subjectName: 'Estudo',
    topicName: 'Conceitos',
  };
  let release!: () => void;
  h.state.wait = new Promise<void>((resolve) => {
    release = resolve;
  });
  const first = h.request({ operation: 'analyze', material });
  // Wait for actual execution to begin, not for an arbitrary timer.
  while (h.state.calls === 0) await new Promise((resolve) => setTimeout(resolve, 5));
  const duplicate = await h.request({ operation: 'analyze', material });
  assert.equal(duplicate.status, 409);
  release();
  assert.equal((await first).status, 200);
  h.state.wait = undefined;
  h.state.output = {
    ...sampleAnalysis(),
    concepts: [
      { ...sampleAnalysis().concepts[0], evidenceQuote: 'Texto inventado que não existe' },
    ],
  };
  const invalid = await h.request({
    operation: 'analyze',
    material: { ...material, title: 'Outra versão' },
  });
  assert.equal(invalid.status, 502);
  const usage = await h.db.query<{ status: string; input_tokens: number; error_code: string }>(
    'select status,input_tokens,error_code from public.ai_usage order by started_at',
  );
  assert.equal(usage.rows[1].status, 'failed');
  assert.equal(usage.rows[1].input_tokens, 100);
  assert.equal(usage.rows[1].error_code, 'invalid_output');
  const limited = await h.request({
    operation: 'analyze',
    material: { ...material, title: 'Terceira versão' },
  });
  assert.equal(limited.status, 429);
  assert.equal(h.state.calls, 2);
  assert.equal((await h.db.query('select * from public.ai_material_versions')).rows.length, 2);
  assert.equal((await h.request({ operation: 'analyze', material })).status, 200); // Cached even at quota.
});

test('Gemini adapter limits retries, protects the key, supports cancellation and rejects missing configuration', async () => {
  const config = aiConfig((name) => (name === 'GEMINI_API_KEY' ? 'test-only-key' : undefined));
  const model: AIModel = {
    id: config.model,
    provider: 'gemini',
    capability: 'economical',
    costTier: 0,
    tasks: ['extraction'],
  };
  const request: AIRequest = {
    id: 'test',
    userId: ownerA,
    task: 'extraction',
    feature: 'material-analysis',
    preference: 'automatic',
    input: 'test input',
    maxOutputTokens: 1000,
    responseSchema: { type: 'object' },
    systemInstruction: 'test instructions',
  };
  let calls = 0;
  const retry = geminiProvider(config, async (url, init) => {
    calls++;
    assert.equal(String(url).includes('test-only-key'), false);
    assert.equal(new Headers(init?.headers).get('x-goog-api-key'), 'test-only-key');
    assert.deepEqual(JSON.parse(String(init?.body)).generationConfig.responseJsonSchema, {
      type: 'object',
    });
    return calls === 1 ? new Response(null, { status: 503 }) : geminiResponse();
  });
  assert.deepEqual((await retry.execute(request, model)).output, sampleAnalysis());
  assert.equal(calls, 2);
  calls = 0;
  await assert.rejects(
    geminiProvider(config, async () => {
      calls++;
      return new Response(null, { status: 429 });
    }).execute(request, model),
    { code: 'rate_limit' },
  );
  assert.equal(calls, 2);
  await assert.rejects(geminiProvider({ ...config, apiKey: undefined }).execute(request, model), {
    code: 'unavailable',
  });
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(retry.execute(request, model, controller.signal), { code: 'cancelled' });
  await assert.rejects(
    geminiProvider(
      { ...config, timeoutMs: 5 },
      async (_, init) =>
        new Promise((_, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    ).execute(request, model),
    { code: 'timeout' },
  );
});

test('demo/local workspaces never send a note and cancelled or changed sources never import results', async () => {
  let calls = 0;
  const transport = {
    analyze: async () => {
      calls++;
      return {};
    },
    review: async () => ({}),
  };
  for (const repo of [
    new LocalRepository(),
    new LocalRepository(() => createPersonalWorkspace()),
  ]) {
    await assert.rejects(
      createServices(repo, {
        materialAnalysisTransport: transport,
      }).materialAnalysisService.analyze('anything'),
    );
  }
  assert.equal(calls, 0);
  const repo = new LocalRepository(() => createPersonalWorkspace(ownerA));
  const services = createServices(repo, { materialAnalysisTransport: transport });
  const material = await services.materialService.addNote('Teste', sourceText);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(services.materialAnalysisService.analyze(material.id, controller.signal), {
    code: 'cancelled',
  });
  assert.equal(calls, 0);
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const delayed = createServices(repo, {
    materialAnalysisTransport: {
      analyze: async () => {
        await pending;
        return {};
      },
      review: async () => ({}),
    },
  });
  const running = delayed.materialAnalysisService.analyze(material.id);
  repo.update((data) => ({
    ...data,
    materials: data.materials.map((m) => ({ ...m, content: `${m.content} Nova revisão.` })),
  }));
  release();
  await assert.rejects(running, { code: 'invalid_input' });
  assert.equal(repo.getSnapshot().materials[0].analysis, undefined);
  assert.equal(repo.getSnapshot().learning?.events.length, 0);
});
