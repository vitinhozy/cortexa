import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalRepository } from '../services/repository';
import { createServices } from '../services';
import { createPersonalWorkspace } from '../services/personalWorkspace';
import { estimateConceptMastery } from '../features/study/mastery';
import { learnerContext, learnerModel, studyRecommendations } from '../features/study/learner';
import {
  questionSpecifications,
  generateQuestionCandidate,
} from '../features/study/questionEngine';
import type { PracticeConfig } from '../types/practice';

const config: PracticeConfig = {
  topicIds: ['acid'],
  conceptIds: [],
  sourceIds: [],
  mode: 'learn',
  difficulty: 'adaptive',
  count: 1,
  interleaved: true,
  style: 'mixed',
};
test('academic stage changes the actual question selection and preserves stage at session start', async () => {
  const repo = new LocalRepository();
  const services = createServices(repo);
  await services.academicService.save({ stage: 'FOUNDATIONS' });
  const first = await services.practiceService.create(config);
  const level = first.items[0].question.level ?? 1;
  await services.academicService.save({ stage: 'INTERNSHIP', confirmTransition: true });
  services.practiceService.select(first.id, first.items[0].question.correctOptionId);
  services.practiceService.lock(first.id);
  services.practiceService.answer(first.id, 'certain');
  assert.equal(repo.getSnapshot().attempts[0].academicStage, 'FOUNDATIONS');
  const second = await services.practiceService.create(config);
  assert.equal(second.academicStage, 'INTERNSHIP');
  assert.notEqual(first.items[0].question.id, second.items[0].question.id);
  assert.ok((second.items[0].question.level ?? 1) >= level);
  assert.notEqual(
    first.specifications?.[0].learningObjective,
    second.specifications?.[0].learningObjective,
  );
});
test('cards and questions share mastery, history and concept scheduling without double counting', async () => {
  const repo = new LocalRepository();
  const services = createServices(repo);
  await services.questionService.answer('q-acid-1', 'B', 'objective-1');
  const question = repo.getSnapshot().questions.find((q) => q.id === 'q-acid-1')!;
  const id = question.conceptId!;
  const card = await services.flashcardService.fromQuestion(question.id);
  const before = estimateConceptMastery(repo.getSnapshot(), id).value;
  await services.flashcardService.review(card.id, 'again', 'review-once');
  await services.flashcardService.review(card.id, 'again', 'review-once');
  const data = repo.getSnapshot();
  const mastery = estimateConceptMastery(data, id);
  assert.ok(mastery.value < before);
  assert.equal(mastery.objectiveExposures, 1);
  assert.equal(mastery.selfReportedExposures, 1);
  assert.equal(data.reviews.length, 1);
  assert.equal(data.learning?.masteryHistory.length, 2);
  assert.equal(data.practice?.mastery.find((m) => m.conceptId === id)?.value, mastery.value);
  assert.equal(data.metrics.find((m) => m.topicId === 'acid')?.mastery, mastery.value);
  assert.equal(data.practice?.reviews.find((r) => r.conceptId === id)?.intervalDays, 0);
});
test('exams append evidence only on submission and do not duplicate completed events', async () => {
  const repo = new LocalRepository();
  const service = createServices(repo).practiceService;
  const session = await service.create({ ...config, mode: 'exam', count: 2 });
  service.select(session.id, session.items[0].question.correctOptionId);
  assert.equal(repo.getSnapshot().learning?.events.length, 0);
  service.finish(session.id);
  service.finish(session.id);
  assert.equal(
    repo.getSnapshot().learning?.events.filter((e) => e.type === 'QUESTION_ATTEMPT').length,
    1,
  );
  assert.equal(
    repo.getSnapshot().learning?.events.filter((e) => e.type === 'SIMULATION_COMPLETED').length,
    1,
  );
});
test('authored question revisions preserve original attempt snapshot and concept identity', async () => {
  const repo = new LocalRepository(() => createPersonalWorkspace('student'));
  const services = createServices(repo);
  const note = await services.materialService.addNote('Texto', 'Conteúdo próprio.', {
    subjectId: 'anatomy',
    topicName: 'Tema',
  });
  const question = await services.studioService.addQuestion(
    note.topicId,
    'Enunciado original',
    ['Um', 'Dois', 'Três', 'Quatro'],
    0,
    'Explicação original',
    undefined,
    { conceptName: 'Conceito', sourceIds: [`material:${note.id}`] },
  );
  await services.questionService.answer(question.id, 'A', 'revision-attempt');
  await services.studioService.addQuestion(
    note.topicId,
    'Enunciado editado',
    ['A', 'B', 'C', 'D'],
    1,
    'Nova explicação',
    question.id,
    { conceptName: 'Nome editado' },
  );
  const data = repo.getSnapshot();
  assert.equal(data.questions[0].conceptId, question.conceptId);
  assert.equal(data.attempts[0].questionSnapshot?.prompt, 'Enunciado original');
  assert.equal(data.questions[0].revision, 2);
});
test('reading records exposure without increasing mastery and contextual chat uses relevant errors', async () => {
  const repo = new LocalRepository();
  const services = createServices(repo);
  const session = await services.practiceService.create({
    ...config,
    preferredQuestionId: 'q-acid-1',
  });
  services.practiceService.select(session.id, 'A');
  services.practiceService.lock(session.id);
  services.practiceService.answer(session.id, 'certain');
  const before = repo.getSnapshot().learning!.masteryHistory.length;
  await services.studyService.finish('acid', new Date(Date.now() - 60000).toISOString());
  assert.equal(repo.getSnapshot().learning!.masteryHistory.length, before);
  const context = learnerContext(repo.getSnapshot(), 'Compensação respiratória', 'acid');
  assert.ok(context.concepts.some((c) => c.highConfidenceErrors > 0));
  assert.ok(!JSON.stringify(context).includes('messages'));
  const response = await services.aiService.send({
    conversationId: 'context-chat',
    text: 'Explique compensação respiratória',
    mode: 'medicine',
    topicId: 'acid',
  });
  assert.match(response.content, /erro com alta confiança/);
  assert.equal(repo.getSnapshot().learning!.masteryHistory.length, before);
  assert.equal(repo.getSnapshot().learning!.events.at(-1)?.type, 'CHAT_CONCEPT_DISCUSSION');
  assert.equal(studyRecommendations(repo.getSnapshot())[0].reason, 'misconception');
});
test('graph relationships reject foreign IDs and prerequisite cycles', async () => {
  const repo = new LocalRepository();
  const services = createServices(repo);
  const a = await services.learningService.addConcept('acid', 'Conceito A');
  const b = await services.learningService.addConcept('acid', 'Conceito B');
  await services.learningService.relate(a.id, b.id, 'PREREQUISITE_OF');
  await assert.rejects(services.learningService.relate(b.id, a.id, 'PREREQUISITE_OF'), /ciclo/);
  await assert.rejects(services.learningService.relate(a.id, 'foreign', 'RELATED_TO'));
  assert.equal(
    learnerModel(repo.getSnapshot()).concepts.find((c) => c.id === a.id)?.mastery.exposures,
    0,
  );
});
test('generation candidates validate structure and sources and await independent quality review', async () => {
  const repo = new LocalRepository();
  const data = repo.getSnapshot();
  const spec = questionSpecifications(data, config).find(
    (s) => s.conceptId === 'acid-compensation',
  )!;
  const question = data.questions.find((q) => q.id === 'q-acid-1')!;
  const generated = await generateQuestionCandidate({ generate: async () => question }, spec);
  assert.equal(generated.quality, 'needs-review');
  const duplicate = {
    ...question,
    options: question.options.map((option) => ({ ...option, text: 'Duplicada' })),
  };
  await assert.rejects(
    generateQuestionCandidate({ generate: async () => duplicate }, spec),
    /repetir/,
  );
  await assert.rejects(
    generateQuestionCandidate(
      { generate: async () => ({ ...question, sourceIds: ['foreign-source'] }) },
      spec,
    ),
    /autorizada/,
  );
});
