import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeed } from '../mocks/seed';
import { LocalRepository } from '../services/repository';
import { createServices } from '../services';
import { createPracticeService } from '../services/practice';
import { createPersonalWorkspace } from '../services/personalWorkspace';
import {
  conceptId,
  estimateConceptMastery,
  questionLevel,
  validPracticeState,
} from '../features/study/practice';
import type { PracticeConfig } from '../types/practice';

const config = (overrides: Partial<PracticeConfig> = {}): PracticeConfig => ({
  topicIds: ['acid'],
  conceptIds: [],
  sourceIds: [],
  count: 5,
  mode: 'learn',
  difficulty: 'adaptive',
  style: 'mixed',
  interleaved: true,
  ...overrides,
});
function context() {
  const repo = new LocalRepository();
  return { repo, service: createServices(repo).practiceService };
}

test('confident errors schedule the concept and adapt to a new, simpler variant atomically', async () => {
  const { repo, service } = context();
  const session = await service.create(config({ preferredQuestionId: 'q-acid-1' }));
  service.select(session.id, 'A');
  service.lock(session.id);
  service.answer(session.id, 'certain');
  service.answer(session.id, 'guess');
  const data = repo.getSnapshot();
  assert.equal(data.attempts.length, 1);
  assert.equal(data.attempts[0].confidence, 'certain');
  assert.equal(data.mistakes[0].conceptId, 'acid-compensation');
  assert.equal(data.mistakes[0].exposures, 1);
  assert.ok(Date.parse(data.practice!.reviews[0].dueAt) - Date.now() <= 600000);
  assert.equal(data.practice!.mastery[0].highConfidenceErrors, 1);
  service.advance(session.id);
  const next = repo.getSnapshot().practice!.sessions[0].items[1].question;
  assert.notEqual(next.id, 'q-acid-1');
  assert.ok(['acid-compensation', 'acid-primary'].includes(conceptId(next)));
  assert.ok(questionLevel(next) < 4);
});

test('successful confident retrieval progresses in complexity without repeating the prompt', async () => {
  const { repo, service } = context();
  const session = await service.create(
    config({
      conceptIds: ['acid-compensation'],
      preferredQuestionId: 'practice-demo-compensation-1',
      interleaved: false,
    }),
  );
  const first = session.items[0].question;
  service.select(session.id, first.correctOptionId);
  service.lock(session.id);
  service.answer(session.id, 'certain');
  service.advance(session.id);
  const next = repo.getSnapshot().practice!.sessions[0].items[1].question;
  assert.equal(questionLevel(first), 1);
  assert.equal(questionLevel(next), 2);
  assert.notEqual(first.id, next.id);
  assert.ok(repo.getSnapshot().practice!.reviews[0].intervalDays >= 3);
});

test('fixed difficulty is preserved through the whole session and caps at its available bank', async () => {
  for (const difficulty of ['Fácil', 'Média', 'Difícil'] as const) {
    const { repo, service } = context();
    const session = await service.create(config({ count: 50, difficulty }));
    assert.ok(session.config.count < 50);
    assert.equal(session.config.count, session.pool.length);
    for (let index = 0; index < session.config.count; index++) {
      const current = repo.getSnapshot().practice!.sessions[0];
      const question = current.items[current.currentIndex].question;
      assert.equal(question.difficulty, difficulty);
      service.select(session.id, question.correctOptionId);
      service.lock(session.id);
      service.answer(session.id, 'certain');
      service.advance(session.id);
    }
    const completed = repo.getSnapshot().practice!.sessions[0];
    assert.equal(completed.status, 'completed');
    assert.equal(completed.items.length, session.config.count);
    assert.equal(repo.getSnapshot().attempts.length, session.config.count);
  }
});

test('confidence and recency affect mastery; guessing does not imply consolidated knowledge', () => {
  const data = createSeed();
  const now = new Date('2026-10-18T12:00:00Z');
  data.attempts = Array.from({ length: 6 }, (_, index) => ({
    id: String(index),
    questionId: 'q-acid-1',
    conceptId: 'acid-compensation',
    topicId: 'acid',
    correct: true,
    selectedOptionId: 'B',
    createdAt: now.toISOString(),
    confidence: 'certain',
  }));
  const confident = estimateConceptMastery(data, 'acid-compensation', now);
  const guessed = estimateConceptMastery(
    { ...data, attempts: data.attempts.map((attempt) => ({ ...attempt, confidence: 'guess' })) },
    'acid-compensation',
    now,
  );
  const old = estimateConceptMastery(data, 'acid-compensation', new Date('2027-04-18T12:00:00Z'));
  assert.ok(confident.value > guessed.value + 20);
  assert.ok(confident.value > old.value);
  assert.ok(confident.sufficientEvidence);
  assert.equal(estimateConceptMastery(createPersonalWorkspace(), 'new').exposures, 0);
});

test('diagnostic sampling covers concepts rather than a long block of the same concept', async () => {
  const { repo, service } = context();
  const session = await service.create(config({ mode: 'diagnostic' }));
  for (let index = 0; index < 5; index++) {
    const value = repo.getSnapshot().practice!.sessions[0];
    const question = value.items[value.currentIndex].question;
    service.select(value.id, question.correctOptionId);
    service.lock(value.id);
    service.answer(value.id, 'certain');
    service.advance(value.id);
  }
  const value = repo.getSnapshot().practice!.sessions[0];
  assert.equal(value.status, 'completed');
  assert.equal(new Set(value.items.map((item) => conceptId(item.question))).size, 5);
  assert.equal(new Set(value.items.map((item) => item.question.id)).size, 5);
  assert.equal(repo.getSnapshot().sessions.filter((item) => item.id === session.id).length, 1);
});

test('exams persist drafts and flags without affecting performance before final submission', async () => {
  const { repo, service } = context();
  const session = await service.create(config({ mode: 'exam' }));
  service.select(session.id, session.items[0].question.correctOptionId);
  service.flag(session.id);
  service.move(session.id, 1);
  service.select(session.id, session.items[1].question.correctOptionId);
  assert.equal(repo.getSnapshot().attempts.length, 0);
  const original = repo.getSnapshot().metrics[0].mastery;
  service.pause(session.id);
  service.select(session.id, 'A');
  assert.equal(repo.getSnapshot().practice!.sessions[0].status, 'paused');
  let storage = JSON.stringify(repo.getSnapshot());
  const resumedRepo = new LocalRepository();
  await resumedRepo.hydrate({
    getItem: async () => storage,
    setItem: async (_key, value) => {
      storage = value;
    },
  });
  const resumed = createServices(resumedRepo).practiceService;
  resumed.resume(session.id);
  assert.equal(resumedRepo.getSnapshot().practice!.sessions[0].items[0].flagged, true);
  assert.equal(resumedRepo.getSnapshot().practice!.sessions[0].currentIndex, 1);
  assert.equal(resumedRepo.getSnapshot().metrics[0].mastery, original);
  resumed.finish(session.id);
  resumed.finish(session.id);
  assert.equal(resumedRepo.getSnapshot().attempts.length, 2);
  assert.equal(resumedRepo.getSnapshot().practice!.sessions[0].status, 'completed');
  assert.equal(
    resumedRepo.getSnapshot().sessions.filter((item) => item.id === session.id).length,
    1,
  );
  assert.ok(validPracticeState(resumedRepo.getSnapshot().practice));
});

test('expired timed exams are finalized on resume, including only saved answers', async () => {
  const { repo, service } = context();
  const session = await service.create(config({ mode: 'exam', timeLimitSeconds: 60 }));
  service.select(session.id, session.items[0].question.correctOptionId);
  repo.update((data) => ({
    ...data,
    practice: {
      ...data.practice!,
      sessions: data.practice!.sessions.map((value) => ({
        ...value,
        status: 'paused',
        deadlineAt: new Date(Date.now() - 1000).toISOString(),
      })),
    },
  }));
  service.resume(session.id);
  assert.equal(repo.getSnapshot().practice!.sessions[0].status, 'completed');
  assert.equal(repo.getSnapshot().attempts.length, 1);
});

test('ending a learning session does not grade an unsubmitted draft answer', async () => {
  const { repo, service } = context();
  const session = await service.create(config());
  service.select(session.id, session.items[0].question.correctOptionId);
  service.finish(session.id);
  assert.equal(repo.getSnapshot().attempts.length, 0);
  assert.equal(repo.getSnapshot().practice!.sessions[0].status, 'completed');
});

test('progressive cases preserve the order and do not expose a later stage first', async () => {
  const repo = new LocalRepository();
  const questions = repo
    .getSnapshot()
    .questions.filter((question) => question.caseGroupId === 'case-acid-demo');
  const service = createPracticeService(repo, {
    analyze: async () => ({ questions, concepts: [], sources: [], topicIds: ['acid'] }),
  });
  const session = await service.create(config({ count: 2, preferredQuestionId: questions[1].id }));
  assert.equal(session.items[0].question.caseStep, 1);
  service.select(session.id, session.items[0].question.correctOptionId);
  service.lock(session.id);
  service.answer(session.id, 'certain');
  service.advance(session.id);
  assert.equal(repo.getSnapshot().practice!.sessions[0].items[1].question.caseStep, 2);
});

test('personal sources require authored links and never borrow demonstration questions', async () => {
  const repo = new LocalRepository(() => createPersonalWorkspace());
  const services = createServices(repo);
  const material = await services.materialService.addNote(
    'Meu conteúdo',
    'Texto escrito pelo estudante.',
    { subjectId: 'physiology', topicName: 'Meu assunto' },
  );
  const sourceId = `material:${material.id}`;
  await services.studioService.addQuestion(
    material.topicId,
    'Questão sem fonte?',
    ['A', 'B', 'C', 'D'],
    0,
    'Explicação do autor.',
  );
  const selection = config({ topicIds: [material.topicId], sourceIds: [sourceId] });
  assert.equal((await services.practiceService.analyze(selection)).questions.length, 0);
  const linked = await services.studioService.addQuestion(
    material.topicId,
    'Questão baseada no meu texto?',
    ['Uma', 'Duas', 'Três', 'Quatro'],
    1,
    'Explicação escrita por mim.',
    undefined,
    { sourceIds: [sourceId], conceptName: 'Conceito próprio' },
  );
  const result = await services.practiceService.analyze(selection);
  assert.deepEqual(
    result.questions.map((question) => question.id),
    [linked.id],
  );
  assert.equal(result.questions[0].citations?.[0].kind, 'material');
  assert.equal(result.questions[0].citations?.[0].title, 'Meu conteúdo');
  const session = await services.practiceService.create(selection);
  assert.equal(session.config.count, 1);
  assert.ok(session.items.every((item) => item.question.authored));
});

test('invalid configuration and foreign source IDs never create a session', async () => {
  const { repo, service } = context();
  await assert.rejects(service.create(config({ count: 0 })));
  await assert.rejects(service.create(config({ topicIds: ['foreign'] })));
  await assert.rejects(service.create(config({ sourceIds: ['material:foreign'] })));
  await assert.rejects(service.create(config({ mode: 'diagnostic', count: 20 })));
  await assert.rejects(service.create(config({ mode: 'exam', timeLimitSeconds: -60 })));
  assert.equal(repo.getSnapshot().practice, undefined);
});

test('old snapshots gain the demo bank once and malformed practice snapshots are preserved', async () => {
  const seed = createSeed();
  seed.questions = seed.questions.filter((question) => !question.id.startsWith('practice-demo-'));
  const repo = new LocalRepository();
  await repo.hydrate({ getItem: async () => JSON.stringify(seed), setItem: async () => {} });
  assert.equal(repo.getSnapshot().questions.length, createSeed().questions.length);
  const malformed = { ...seed, practice: { sessions: [{}], mastery: [], reviews: [] } };
  const blocked = new LocalRepository();
  let writes = 0;
  await blocked.hydrate({
    getItem: async () => JSON.stringify(malformed),
    setItem: async () => {
      writes++;
    },
  });
  blocked.update((data) => ({ ...data }));
  await blocked.flush();
  assert.equal(blocked.storageError, true);
  assert.equal(writes, 0);
});
