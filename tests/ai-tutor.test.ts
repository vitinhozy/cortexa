import test from 'node:test';
import assert from 'node:assert/strict';
import { tutorHandler } from '../supabase/functions/_shared/ai/tutor';
import { geminiProvider } from '../supabase/functions/_shared/ai/gemini';
import { LocalRepository } from '../services/repository';
import { createPersonalWorkspace } from '../services/personalWorkspace';
import { createServices } from '../services';
import type { AIModel, AIProvider, AIRequest } from '../types/ai';

const owner = '5d6c8d34-b844-4ebc-ae2a-26e390d98346';
const config = {
  apiKey: 'test-only-key',
  model: 'gemini-3.8-flash',
  timeoutMs: 1000,
  maxOutputTokens: 2048,
  dailyLimit: 20,
  dailyTutorLimit: 3,
};
const payload = {
  question: 'Explique a diferença entre pré-carga e pós-carga.',
  history: [{ role: 'user', content: 'Estou revisando fisiologia cardiovascular.' }],
  topicName: 'Hemodinâmica',
  materialTitle: 'Anotação de aula',
  materialContent: 'Pré-carga descreve o estiramento ventricular antes da contração.',
};
function request(body: unknown, token = 'valid-user-token') {
  return new Request('https://local.test/functions/v1/ai-tutor-chat', {
    method: 'POST',
    headers: token ? { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' } : {},
    body: JSON.stringify(body),
  });
}
function harness(options: { limited?: boolean; output?: unknown } = {}) {
  const calls: { request?: AIRequest; model?: AIModel; finishes: unknown[]; claims: unknown[] } = {
    finishes: [],
    claims: [],
  };
  const provider: AIProvider = {
    id: 'gemini',
    execute: async (aiRequest, model) => {
      calls.request = aiRequest;
      calls.model = model;
      return {
        output: options.output ?? 'Pré-carga é o enchimento do ventrículo antes da contração.',
        inputTokens: 25,
        outputTokens: 18,
      };
    },
  };
  const store = {
    authenticate: async (token: string) => {
      if (token !== 'valid-user-token') throw new Error('invalid');
      return owner;
    },
    claim: async (...args: unknown[]) => {
      calls.claims.push(args);
      return options.limited ? ('limited' as const) : ('claimed' as const);
    },
    finish: async (...args: unknown[]) => {
      calls.finishes.push(args);
    },
  };
  return {
    calls,
    handler: tutorHandler({
      authenticate: store.authenticate,
      store,
      provider,
      config,
    }),
  };
}
test('tutor returns Gemini provenance and sends bounded context through the existing AI executor', async () => {
  const h = harness();
  const response = await h.handler(request(payload));
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(
    { provider: result.provider, model: result.model, promptVersion: result.promptVersion },
    { provider: 'gemini', model: 'gemini-3.8-flash', promptVersion: 'tutor-chat.v1' },
  );
  assert.match(result.answer, /Pré-carga/);
  assert.equal(h.calls.request?.task, 'tutoring');
  assert.equal(h.calls.request?.feature, 'tutor-chat');
  assert.equal(h.calls.request?.userId, owner);
  assert.equal(h.calls.request?.maxOutputTokens, 2048);
  assert.equal(h.calls.model?.provider, 'gemini');
  const claim = h.calls.claims[0] as unknown[];
  assert.equal(claim[0], owner);
  assert.match(String(claim[1]), /^[0-9a-f-]{36}$/i);
  assert.deepEqual(claim.slice(2), ['gemini', config.model, 3]);
  const persisted = JSON.stringify(h.calls.finishes);
  assert.equal(persisted.includes(payload.question), false);
  assert.equal(persisted.includes(payload.materialContent), false);
  assert.equal(persisted.includes('test-only-key'), false);
});
test('tutor requires a real non-anonymous session before claiming quota', async () => {
  const h = harness();
  const response = await h.handler(request(payload, ''));
  assert.equal(response.status, 401);
  assert.equal(h.calls.claims.length, 0);
});
test('tutor daily limit and invalid prompt are enforced before invoking Gemini', async () => {
  const limited = harness({ limited: true });
  assert.equal((await limited.handler(request(payload))).status, 429);
  assert.equal(limited.calls.request, undefined);
  const malformed = harness();
  assert.equal((await malformed.handler(request({ ...payload, owner }))).status, 400);
  assert.equal(malformed.calls.request, undefined);
});
test('Gemini provider accepts plain text output without enabling JSON mode', async () => {
  let sentBody: Record<string, unknown> | undefined;
  let sentKey = '';
  const provider = geminiProvider(config, (async (_input, init) => {
    sentKey = new Headers(init?.headers).get('x-goog-api-key') ?? '';
    sentBody = JSON.parse(String(init?.body));
    return Response.json({
      candidates: [
        { finishReason: 'STOP', content: { parts: [{ text: 'Resposta clara em texto.' }] } },
      ],
      usageMetadata: { promptTokenCount: 7, candidatesTokenCount: 5 },
    });
  }) as typeof fetch);
  const response = await provider.execute(
    {
      id: 'c144ee68-b8b4-45d0-9f1b-33ec42fd72a3',
      userId: owner,
      feature: 'tutor-chat',
      task: 'tutoring',
      preference: 'study',
      input: JSON.stringify(payload),
      systemInstruction: 'Explique para estudar.',
      maxOutputTokens: 2048,
    },
    {
      id: config.model,
      provider: 'gemini',
      capability: 'standard',
      costTier: 1,
      tasks: ['tutoring'],
    },
  );
  assert.equal(response.output, 'Resposta clara em texto.');
  assert.equal(response.inputTokens, 7);
  assert.equal(response.outputTokens, 5);
  assert.equal(sentKey, config.apiKey);
  assert.deepEqual(sentBody?.generationConfig, { maxOutputTokens: 2048 });
});
test('personal chat stores Gemini provenance locally and a retry does not duplicate the user turn', async () => {
  const repo = new LocalRepository(() => createPersonalWorkspace(owner));
  const sent: unknown[] = [];
  let unavailable = true;
  const services = createServices(repo, {
    aiTutorTransport: {
      send: async (_owner, body) => {
        sent.push(body);
        if (unavailable) throw new Error('network timeout');
        return {
          answer: 'Resposta vinda do transporte Gemini.',
          provider: 'gemini',
          model: config.model,
          promptVersion: 'tutor-chat.v1',
        };
      },
    },
  });
  const input = {
    conversationId: 'chat-local-test',
    text: 'Explique o conceito.',
    mode: 'class' as const,
  };
  await assert.rejects(services.aiService.send(input));
  assert.equal(services.aiService.conversation(input.conversationId)?.messages.length, 1);
  unavailable = false;
  await services.aiService.send(input);
  const messages = services.aiService.conversation(input.conversationId)?.messages ?? [];
  assert.equal(messages.length, 2);
  assert.equal(messages[0].role, 'user');
  assert.equal(messages[1].provider, 'gemini');
  assert.equal(messages[1].model, config.model);
  assert.equal(messages[1].promptVersion, 'tutor-chat.v1');
  assert.equal(messages[1].simulated, false);
  assert.deepEqual((sent[1] as { history: unknown[] }).history, []);
});
