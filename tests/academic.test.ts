import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalRepository } from '../services/repository';
import { createPersonalWorkspace } from '../services/personalWorkspace';
import { createServices } from '../services';
import { createSeed } from '../mocks/seed';
import { migrateSnapshot } from '../services/migrations';
import { learnerModel } from '../features/study/learner';
import { validCourseEntry } from '../features/study/academic';

const personal = () =>
  new LocalRepository(() => createPersonalWorkspace('student'), 'academic-test');
test('short onboarding accepts unknown stage without subjects, goal or fabricated entry', async () => {
  const repo = personal();
  assert.equal(learnerModel(repo.getSnapshot()).academic.semester, undefined);
  await createServices(repo).profileService.save({
    name: 'Ana',
    course: 'Medicina',
    semester: 1,
    university: '',
    goal: '',
    dailyMinutes: 30,
    subjectIds: [],
    journey: { stage: 'UNKNOWN', semesterConfirmed: false },
  });
  const data = repo.getSnapshot();
  assert.equal(data.user.onboardingComplete, true);
  assert.equal(data.academicJourney?.courseEntry, undefined);
  assert.equal(learnerModel(data).academic.semester, undefined);
  assert.equal(data.attempts.length, 0);
});
test('year precision stays a year and stage transitions require confirmation atomically', async () => {
  const repo = personal();
  const service = createServices(repo).academicService;
  await service.save({ stage: 'FOUNDATIONS', courseEntry: { precision: 'year', year: 2020 } });
  assert.deepEqual(repo.getSnapshot().academicJourney?.courseEntry, {
    precision: 'year',
    year: 2020,
  });
  const before = repo.getSnapshot();
  await assert.rejects(service.save({ stage: 'INTERNSHIP' }), /Confirme/);
  assert.equal(repo.getSnapshot(), before);
  await service.save({ stage: 'INTERNSHIP', confirmTransition: true });
  assert.equal(repo.getSnapshot().academicJourney?.transitions.length, 2);
  assert.equal(repo.getSnapshot().user.semester, 1);
  assert.equal(repo.getSnapshot().academicJourney?.stage, 'INTERNSHIP');
  assert.equal(validCourseEntry({ precision: 'date', date: '2020-02-30' }), false);
});
test('academic migration is additive, idempotent and never transforms demo scores into events', () => {
  const old = createSeed();
  const once = migrateSnapshot(old);
  const twice = migrateSnapshot(once);
  assert.equal(twice.user.answered, old.user.answered);
  assert.equal(twice.learning?.events.length, 0);
  assert.equal(twice.academicJourney?.stage, 'UNKNOWN');
  assert.deepEqual(once, twice);
});
test('invalid inner snapshots and invalid journeys are preserved rather than overwritten', async () => {
  for (const change of [
    { topics: [{ id: 'broken' }] },
    { academicJourney: { stage: 'automatic-clinical' } },
  ]) {
    const raw = JSON.stringify({ ...createPersonalWorkspace('student'), ...change });
    let stored = raw;
    const repo = personal();
    await repo.hydrate({
      getItem: async () => stored,
      setItem: async (_key, value) => {
        stored = value;
      },
    });
    assert.equal(repo.storageError, true);
    repo.update((data) => ({ ...data, preferences: { ...data.preferences, notifications: true } }));
    assert.equal(await repo.flush(), false);
    assert.equal(await repo.retryPersistence(), false);
    assert.equal(stored, raw);
  }
});
test('failed writes report failure and can retry without discarding in-memory data', async () => {
  let fail = true;
  let stored = '';
  const repo = personal();
  await repo.hydrate({
    getItem: async () => null,
    setItem: async (_key, value) => {
      if (fail) throw new Error('offline-storage');
      stored = value;
    },
  });
  await createServices(repo).academicService.save({ stage: 'CLINICAL' });
  assert.equal(await repo.flush(), false);
  fail = false;
  assert.equal(await repo.retryPersistence(), true);
  assert.equal(JSON.parse(stored).academicJourney.stage, 'CLINICAL');
});
