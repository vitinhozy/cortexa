import test from 'node:test';
import assert from 'node:assert/strict';
import { syntheticAssessment } from '../mocks/assessments';
import { assessmentCoverage, assessmentEligibility } from '../features/study/assessments';
import { emptyJourney } from '../features/study/academic';
import { LocalRepository } from '../services/repository';
import { createServices } from '../services';
import { addDays, localDate } from '../utils/date';

test('eligibility preserves unknown precision and refuses pending or superseded rules', () => {
  const framework = syntheticAssessment();
  assert.equal(assessmentEligibility(emptyJourney(), framework).status, 'unknown');
  assert.equal(
    assessmentEligibility(
      { ...emptyJourney(), courseEntry: { precision: 'year', year: 2002 } },
      framework,
    ).status,
    'unknown',
  );
  assert.equal(
    assessmentEligibility(
      { ...emptyJourney(), courseEntry: { precision: 'date', date: '2002-06-15' } },
      framework,
    ).status,
    'eligible',
  );
  assert.equal(
    assessmentEligibility(
      { ...emptyJourney(), courseEntry: { precision: 'year', year: 2001 } },
      framework,
    ).status,
    'ineligible',
  );
  for (const status of ['APPROVED_BY_CONGRESS', 'SANCTIONED', 'SUPERSEDED'] as const)
    assert.equal(
      assessmentEligibility(emptyJourney(), {
        ...framework,
        regulation: { ...framework.regulation, status },
      }).status,
      'inactive',
    );
});
test('framework versions are immutable, goals select blueprint concepts and sessions freeze versions', async () => {
  const repo = new LocalRepository();
  const services = createServices(repo);
  const framework = syntheticAssessment();
  await services.assessmentService.importFramework(framework);
  await assert.rejects(
    services.assessmentService.importFramework({ ...framework, title: 'Alteração indevida' }),
    /versão/,
  );
  await services.assessmentService.importFramework(syntheticAssessment('test-2'));
  const goal = await services.assessmentService.addGoal({
    frameworkId: framework.id,
    frameworkVersion: framework.version,
    stageId: 'test-stage',
    targetDate: addDays(localDate(), 10),
  });
  const session = await services.practiceService.create({
    assessmentGoalId: goal.id,
    topicIds: ['acid'],
    conceptIds: [],
    sourceIds: [],
    mode: 'exam',
    difficulty: 'adaptive',
    count: 5,
    style: 'mixed',
    interleaved: true,
  });
  assert.ok(session.pool.every((q) => q.conceptId === 'acid-compensation'));
  assert.equal(session.assessmentContext?.frameworkVersion, 'test-1');
  assert.equal(repo.getSnapshot().assessments?.frameworks.length, 2);
  assert.equal(
    assessmentCoverage(repo.getSnapshot(), framework, 'test-stage').status,
    'insufficient-evidence',
  );
  services.practiceService.select(session.id, session.items[0].question.correctOptionId);
  services.practiceService.finish(session.id);
  assert.equal(repo.getSnapshot().attempts[0].assessmentContext?.blueprintVersion, 'test-1');
});
test('invalid and pending blueprints cannot silently activate assessment-specific practice', async () => {
  const repo = new LocalRepository();
  const services = createServices(repo);
  const framework = syntheticAssessment();
  await assert.rejects(
    services.assessmentService.importFramework({
      ...framework,
      blueprint: { ...framework.blueprint, source: undefined },
    }),
  );
  await services.assessmentService.importFramework({
    ...framework,
    regulation: { ...framework.regulation, status: 'APPROVED_BY_CONGRESS' },
  });
  const goal = await services.assessmentService.addGoal({
    frameworkId: framework.id,
    frameworkVersion: framework.version,
    stageId: 'test-stage',
    targetDate: addDays(localDate(), 10),
  });
  await assert.rejects(
    services.practiceService.create({
      assessmentGoalId: goal.id,
      topicIds: ['acid'],
      conceptIds: [],
      sourceIds: [],
      mode: 'learn',
      difficulty: 'adaptive',
      count: 1,
      style: 'mixed',
      interleaved: true,
    }),
    /regulamentada/,
  );
  assert.equal(repo.getSnapshot().practice?.sessions.length ?? 0, 0);
});
