import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalRepository } from '../services/repository';
import { createServices } from '../services';
import { migrateSnapshot } from '../services/migrations';
import { estimateConceptMastery } from '../features/study/mastery';
test('legacy metric caches rebuild from preserved evidence rather than keeping an incompatible percentage', async () => {
  const repo = new LocalRepository();
  await createServices(repo).questionService.answer('q-acid-1', 'A', 'legacy-answer');
  const old = {
    ...repo.getSnapshot(),
    learning: undefined,
    practice: undefined,
    metrics: repo
      .getSnapshot()
      .metrics.map((m) => (m.topicId === 'acid' ? { ...m, mastery: 99 } : m)),
  };
  const migrated = migrateSnapshot(old);
  assert.equal(migrated.attempts.length, 1);
  assert.equal(
    migrated.metrics.find((m) => m.topicId === 'acid')?.mastery,
    estimateConceptMastery(migrated, 'acid-compensation').value,
  );
  assert.equal(migrated.learning?.events.filter((e) => e.type === 'QUESTION_ATTEMPT').length, 1);
  assert.deepEqual(migrateSnapshot(migrated).learning?.events, migrated.learning?.events);
});
