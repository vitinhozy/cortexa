import test from 'node:test';
import assert from 'node:assert/strict';
import { createPersonalWorkspace } from '../services/personalWorkspace';
import { LocalRepository, STORAGE_KEY } from '../services/repository';
import { createServices } from '../services';
import { publicAuthConfig } from '../services/authConfig';
import { isDue, recommendTopics } from '../features/study/engine';
import { studentContext } from '../features/study/context';
import { reconcilePersonalProgress } from '../features/study/progress';
import { addDays, localDate } from '../utils/date';
import { FOLDER_PALETTE } from '../constants/folderPalette';

function personal(owner = 'local') {
  return new LocalRepository(() => createPersonalWorkspace(owner), `personal:${owner}`);
}
const profile = {
  name: 'Ana',
  course: 'Medicina',
  semester: 3,
  university: '',
  goal: 'Revisar aulas',
  dailyMinutes: 45,
  subjectIds: ['anatomy'],
};

test('personal space starts without demo history, performance, content or recommendations', () => {
  const data = personal().getSnapshot();
  for (const list of [
    data.questions,
    data.materials,
    data.topics,
    data.attempts,
    data.metrics,
    data.flashcards,
    data.sessions,
    data.exams,
    data.conversations,
  ])
    assert.equal(list.length, 0);
  assert.equal(data.user.xp, 0);
  assert.equal(data.user.minutes, 0);
  assert.deepEqual(recommendTopics(data), []);
  assert.deepEqual(studentContext(data).weakTopicIds, []);
});
test('demo, local and two authenticated owners persist independently', async () => {
  const map = new Map<string, string>();
  const storage = {
    async getItem(key: string) {
      return map.get(key) ?? null;
    },
    async setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
  const demo = new LocalRepository();
  const local = personal();
  const first = personal('first');
  const second = personal('second');
  for (const repo of [demo, local, first, second]) await repo.hydrate(storage);
  await createServices(first).profileService.save(profile);
  await createServices(local).materialService.addNote('Local only', 'Texto próprio', {
    subjectId: 'anatomy',
    topicName: 'Osso',
  });
  demo.update((data) => ({ ...data }));
  await Promise.all([demo.flush(), local.flush(), first.flush(), second.flush()]);
  assert.ok(map.has(STORAGE_KEY));
  const reopened = personal('first');
  await reopened.hydrate(storage);
  assert.equal(reopened.getSnapshot().user.name, 'Ana');
  assert.equal(reopened.getSnapshot().materials.length, 0);
  assert.equal(second.getSnapshot().user.name, 'Estudante');
  assert.equal(demo.getSnapshot().user.name, 'Victor');
});
test('invalid profile and dates reject atomically without changing progress', async () => {
  const repo = personal();
  const services = createServices(repo);
  const initial = repo.getSnapshot();
  await assert.rejects(services.profileService.save({ ...profile, semester: 0 }));
  await assert.rejects(services.profileService.save({ ...profile, dailyMinutes: Infinity }));
  await assert.rejects(services.profileService.save({ ...profile, subjectIds: ['not-a-subject'] }));
  await assert.rejects(
    services.examService.add({
      title: 'Prova',
      subjectId: 'anatomy',
      date: '2099-02-31',
      topicIds: [],
    }),
  );
  assert.equal(repo.getSnapshot(), initial);
  await services.profileService.save(profile);
  assert.equal(repo.getSnapshot().user.weeklyGoal, 225);
  assert.equal(repo.getSnapshot().user.xp, 0);
  assert.equal(repo.getSnapshot().user.onboardingComplete, true);
});
test('notes connect to chosen subjects and topics without inventing knowledge or AI output', async () => {
  const repo = personal();
  const services = createServices(repo);
  const note = await services.materialService.addNote('Aula 1', 'Minha anotação original', {
    subjectId: 'anatomy',
    topicName: 'Membro superior',
  });
  const second = await services.materialService.addNote('Aula 2', 'Mais uma anotação', {
    subjectId: 'anatomy',
    topicName: 'Membro superior',
  });
  assert.equal(note.subjectId, 'anatomy');
  assert.equal(note.topicId, second.topicId);
  assert.equal(repo.getSnapshot().topics.length, 1);
  assert.equal(repo.getSnapshot().topics[0].summary, 'Minha anotação original');
  assert.deepEqual(studentContext(repo.getSnapshot()).weakTopicIds, []);
  await assert.rejects(
    services.aiService.send({
      conversationId: 'personal',
      text: 'Resuma',
      mode: 'class',
      materialId: note.id,
    }),
    /análise de materiais ainda não está configurada/,
  );
  assert.equal(repo.getSnapshot().conversations.length, 0);
});
test('folder rename, move, favorites and removal preserve note content', async () => {
  const repo = personal();
  const services = createServices(repo);
  const folder = await services.folderService.create('Semestre 3', FOLDER_PALETTE[2].color);
  assert.equal(folder.color, FOLDER_PALETTE[2].color);
  await assert.rejects(services.folderService.create(' semestre 3 '));
  const note = await services.materialService.addNote('Anotação', 'Texto preservado', {
    subjectId: 'anatomy',
    topicName: '',
    folderId: folder.id,
  });
  await services.folderService.rename(folder.id, 'Aulas', FOLDER_PALETTE[4].color);
  assert.equal(repo.getSnapshot().folders?.[0].color, FOLDER_PALETTE[4].color);
  await services.folderService.favoriteMaterial(note.id);
  await assert.rejects(services.folderService.moveMaterial(note.id, 'missing'));
  await services.folderService.remove(folder.id);
  const saved = repo.getSnapshot().materials[0];
  assert.equal(saved.folderId, undefined);
  assert.equal(saved.favorite, true);
  assert.equal(saved.content, 'Texto preservado');
});
test('unreadable personal storage is not overwritten by new data', async () => {
  let writes = 0;
  const repo = personal();
  await repo.hydrate({
    async getItem() {
      return '{broken';
    },
    async setItem() {
      writes++;
    },
  });
  await createServices(repo).profileService.save(profile);
  await repo.flush();
  assert.equal(writes, 0);
  assert.equal(repo.storageError, true);
});
test('a snapshot belonging to another account is refused', async () => {
  const repo = personal('first');
  await repo.hydrate({
    async getItem() {
      return JSON.stringify(createPersonalWorkspace('second'));
    },
    async setItem() {},
  });
  assert.equal(repo.getSnapshot().user.id, 'first');
  assert.equal(repo.storageError, true);
});
test('due reviews respect the actual retry time, not just the calendar day', () => {
  const now = new Date('2026-10-17T12:00:00Z');
  assert.equal(isDue('2026-10-17T12:10:00Z', now), false);
  assert.equal(isDue('2026-10-17T11:59:59Z', now), true);
  assert.equal(isDue(localDate(now), now), true);
});
test('personal weekly time and stale streak are recomputed from recorded activity', () => {
  const now = new Date('2026-10-21T12:00:00');
  const data = createPersonalWorkspace();
  data.user.weeklyMinutes = 999;
  data.user.streak = 4;
  data.user.lastStudyDate = '2026-10-17';
  data.sessions = [
    {
      id: 'a',
      topicId: 't',
      startedAt: '2026-10-20T10:00:00',
      endedAt: '2026-10-20T10:15:00',
      minutes: 15,
    },
    {
      id: 'b',
      topicId: 't',
      startedAt: '2026-10-10T10:00:00',
      endedAt: '2026-10-10T10:30:00',
      minutes: 30,
    },
  ];
  const result = reconcilePersonalProgress(data, now);
  assert.equal(result.user.weeklyMinutes, 15);
  assert.equal(result.user.minutes, 45);
  assert.equal(result.user.streak, 0);
});
test('exam-specific plans retain selected topics and reject invalid direct calls', async () => {
  const repo = personal();
  const services = createServices(repo);
  const note = await services.materialService.addNote('Aula', 'Texto', {
    subjectId: 'anatomy',
    topicName: 'Osso',
  });
  const date = addDays(localDate(), 3);
  const exam = await services.examService.add({
    title: 'Anatomia N1',
    date,
    subjectId: 'anatomy',
    topicIds: [note.topicId],
  });
  const plan = await services.studyService.plan(exam.topicIds, 30, date);
  assert.ok(plan.blocks.every((block) => block.topicId === note.topicId));
  assert.equal(
    plan.blocks.reduce((sum, block) => sum + block.minutes, 0),
    90,
  );
  await assert.rejects(services.studyService.plan([note.topicId], 999, date));
  await assert.rejects(services.studyService.plan([note.topicId], 30, '2026-02-31'));
  await assert.rejects(services.studyService.finish('missing', new Date().toISOString()));
});
test('auth configuration accepts only valid public configuration and stays optional', () => {
  assert.equal(publicAuthConfig(undefined, undefined), null);
  assert.equal(publicAuthConfig('https://', 'sb_publishable_example'), null);
  assert.equal(publicAuthConfig('https://project.supabase.co', 'sb_secret_example'), null);
  assert.equal(publicAuthConfig('https://project.supabase.co', 'service_role'), null);
  assert.equal(publicAuthConfig('http://project.supabase.co', 'sb_publishable_example'), null);
  assert.deepEqual(publicAuthConfig('https://project.supabase.co/', 'sb_publishable_example'), {
    url: 'https://project.supabase.co',
    key: 'sb_publishable_example',
  });
});
