import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalRepository, STORAGE_KEY } from '../services/repository';
import { createServices } from '../services';
import type { StorageAdapter } from '../services/contracts';
function storage() {
  const map = new Map<string, string>();
  return {
    map,
    adapter: {
      async getItem(k: string) {
        return map.get(k) ?? null;
      },
      async setItem(k: string, v: string) {
        map.set(k, v);
      },
    } satisfies StorageAdapter,
  };
}
test('wrong answer updates mistakes, knowledge and profile exactly once per attempt', async () => {
  const repo = new LocalRepository();
  const service = createServices(repo);
  const before = repo.getSnapshot();
  await service.questionService.answer('q-acid-1', 'A', 'attempt-1');
  await service.questionService.answer('q-acid-1', 'A', 'attempt-1');
  const after = repo.getSnapshot();
  assert.equal(after.attempts.length, 1);
  assert.equal(after.mistakes.length, before.mistakes.length + 1);
  assert.equal(after.metrics[0].mastery, 38);
  assert.equal(after.user.answered, before.user.answered + 1);
  assert.equal(after.user.correct, before.user.correct);
  await assert.rejects(service.questionService.answer('q-acid-1', 'Z', 'attempt-2'));
});
test('correct answer increments score without creating an error', async () => {
  const repo = new LocalRepository();
  const before = repo.getSnapshot();
  await createServices(repo).questionService.answer('q-acid-1', 'B', 'correct-1');
  assert.equal(repo.getSnapshot().user.correct, before.user.correct + 1);
  assert.equal(repo.getSnapshot().mistakes.length, before.mistakes.length);
  assert.equal(repo.getSnapshot().metrics[0].mastery, 45);
});
test('created flashcards are deduplicated and progress survives rehydration', async () => {
  const memory = storage();
  const repo = new LocalRepository();
  await repo.hydrate(memory.adapter);
  const service = createServices(repo);
  const card = await service.flashcardService.fromQuestion('q-acid-1');
  assert.equal((await service.flashcardService.fromQuestion('q-acid-1')).id, card.id);
  await service.flashcardService.review(card.id, 'easy');
  await repo.flush();
  const reopened = new LocalRepository();
  await reopened.hydrate(memory.adapter);
  assert.equal(reopened.getSnapshot().flashcards.length, 9);
  assert.equal(reopened.getSnapshot().reviews.length, 1);
  assert.equal(reopened.getSnapshot().flashcards.find((f) => f.id === card.id)?.intervalDays, 7);
});
test('invalid snapshots recover safely and expose storage issue', async () => {
  const memory = storage();
  memory.map.set(STORAGE_KEY, '{bad json');
  const repo = new LocalRepository();
  await repo.hydrate(memory.adapter);
  assert.equal(repo.getSnapshot().user.name, 'Victor');
  assert.equal(repo.storageError, true);
});
test('AI conversation preserves material context and identifies simulated sources', async () => {
  const repo = new LocalRepository();
  const service = createServices(repo);
  const response = await service.aiService.send({
    conversationId: 'test-class',
    text: 'Resuma o material',
    mode: 'class',
    materialId: 'renal-pdf',
  });
  assert.ok(response.content.includes('Filtração glomerular'));
  assert.equal(response.sources?.[0].simulated, true);
  assert.equal(service.aiService.conversation('test-class')?.messages.length, 2);
  assert.equal(service.aiService.conversation('test-class')?.materialId, 'renal-pdf');
});
