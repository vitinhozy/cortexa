import test from 'node:test';
import assert from 'node:assert/strict';
import { createPersonalWorkspace } from '../services/personalWorkspace';
import { createSeed } from '../mocks/seed';
import { searchStudy } from '../features/study/search';
import { studyWeek } from '../features/study/rhythm';

test('search uses only the current workspace, normalizes accents and filters categories', () => {
  const data = createPersonalWorkspace('local');
  assert.deepEqual(searchStudy(data, 'acidose'), []);
  data.materials.push({
    id: 'note',
    title: 'Coração',
    content: 'Anotação da aula sobre circulação.',
    topicId: 'topic',
    subjectId: 'cardio',
    createdAt: '2026-10-17',
    type: 'Anotações',
    pages: 1,
    status: 'ready',
  });
  assert.equal(searchStudy(data, ' CIRCULACAO coracao ')[0]?.id, 'note');
  assert.deepEqual(searchStudy(data, 'coracao', 'question'), []);
  assert.deepEqual(searchStudy(data, '  '), []);
  const demo = createSeed();
  const question = demo.questions[1];
  assert.equal(searchStudy(demo, question.prompt, 'question')[0]?.id, question.id);
  const card = demo.flashcards[0];
  assert.equal(searchStudy(demo, card.front, 'flashcard')[0]?.id, card.id);
});

test('weekly activity uses completed records, never fills days from a streak counter', () => {
  const data = createPersonalWorkspace('local');
  data.user.streak = 6;
  assert.equal(studyWeek(data, '2026-10-17').filter((day) => day.active).length, 0);
  data.sessions.push(
    { id: 'unfinished', topicId: 'topic', startedAt: '2026-10-16T12:00:00', minutes: 1 },
    {
      id: 'done',
      topicId: 'topic',
      startedAt: '2026-10-17T11:00:00',
      endedAt: '2026-10-17T12:00:00',
      minutes: 60,
    },
  );
  data.attempts.push({
    id: 'attempt',
    questionId: 'q',
    selectedOptionId: 'a',
    correct: true,
    createdAt: '2026-10-15T12:00:00',
  });
  data.reviews.push({
    id: 'review',
    flashcardId: 'f',
    rating: 'good',
    createdAt: '2026-10-15T13:00:00',
    nextDueAt: '2026-10-18',
  });
  assert.deepEqual(
    studyWeek(data, '2026-10-17')
      .filter((day) => day.active)
      .map((day) => day.date),
    ['2026-10-15', '2026-10-17'],
  );
  assert.equal(studyWeek(data, '2026-10-17').at(-1)?.today, true);
});
