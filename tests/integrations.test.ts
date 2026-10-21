import test from 'node:test';
import assert from 'node:assert/strict';
import { syntheticModels } from '../mocks/ai';
import { createAIExecutor, createAIRouter } from '../services/aiRouter';
import { createTranscriptionService } from '../services/transcription';
import { LocalRepository } from '../services/repository';
import type { AIRequest, AIUsage } from '../types/ai';

const request: AIRequest = {
  id: 'request-1',
  userId: 'test-user',
  feature: 'test-feature',
  task: 'title',
  preference: 'automatic',
  input: 'Texto fictício de teste',
  maxOutputTokens: 100,
};
test('common AI tasks remain economical even in advanced mode and absent models fail explicitly', () => {
  const router = createAIRouter(syntheticModels);
  assert.equal(router.route('title', 'advanced').model, 'test-economical');
  assert.equal(router.route('complex-reasoning').model, 'test-advanced');
  assert.equal(router.route('tutoring', 'study').model, 'test-standard');
  assert.throws(() => router.route('image-analysis'), /configurado/);
});
test('AI execution authorizes first, deduplicates concurrent requests and records real adapter usage once', async () => {
  let calls = 0;
  const usage: AIUsage[] = [];
  const executor = createAIExecutor(
    syntheticModels,
    [
      {
        id: 'test-provider',
        execute: async () => {
          calls++;
          return { output: 'Resultado fictício', inputTokens: 5, outputTokens: 2 };
        },
      },
    ],
    {
      authorize: async () => true,
      recordUsage: async (value) => {
        usage.push(value);
      },
    },
  );
  const values = await Promise.all([executor.execute(request), executor.execute(request)]);
  assert.equal(calls, 1);
  assert.deepEqual(values[0], values[1]);
  assert.equal(usage.length, 1);
  assert.equal(usage[0].inputTokens, 5);
  assert.equal(usage[0].estimatedCost, undefined);
  await assert.rejects(executor.execute({ ...request, input: 'Outro texto' }), /outro conteúdo/);
  const denied = createAIExecutor(
    syntheticModels,
    [
      {
        id: 'test-provider',
        execute: async () => {
          throw new Error('Must not be called');
        },
      },
    ],
    { authorize: async () => false, recordUsage: async () => {} },
  );
  await assert.rejects(denied.execute(request), /orçamento/);
});
test('provider failures log failure without invented tokens or successful output', async () => {
  const usage: AIUsage[] = [];
  const executor = createAIExecutor(
    syntheticModels,
    [
      {
        id: 'test-provider',
        execute: async () => {
          throw new Error('provider-offline');
        },
      },
    ],
    {
      authorize: async () => true,
      recordUsage: async (value) => {
        usage.push(value);
      },
    },
  );
  await assert.rejects(executor.execute(request), /provider-offline/);
  assert.equal(usage.length, 1);
  assert.equal(usage[0].status, 'failed');
  assert.equal(usage[0].inputTokens, undefined);
});
test('transcription stays unavailable without a provider and returns a reviewable draft with a real adapter', async () => {
  const repo = new LocalRepository();
  const input = {
    userId: repo.getSnapshot().user.id,
    uri: 'file:///synthetic-audio',
    mimeType: 'audio/mp4',
    language: 'pt-BR' as const,
  };
  await assert.rejects(createTranscriptionService(repo).transcribe(input), /não está conectada/);
  const service = createTranscriptionService(repo, {
    transcribe: async () => ({
      text: 'Texto sintético retornado pelo adapter de teste.',
      segments: [{ startSeconds: 0, endSeconds: 2, text: 'Texto sintético.' }],
    }),
  });
  const draft = await service.transcribe(input);
  assert.equal(draft.needsReview, true);
  assert.equal(repo.getSnapshot().studio?.length ?? 0, 0);
  await assert.rejects(service.transcribe({ ...input, userId: 'foreign-user' }), /inválida/);
});
