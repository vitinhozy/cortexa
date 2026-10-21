import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeed } from '../mocks/seed';
import { subjectPerformance, topicsToReview } from '../features/study/insights';
import { studyMonth, shiftStudyMonth } from '../features/study/rhythm';

test('accuracy follows answers in the selected subject, independently of mastery', () => {
  const data = createSeed();
  data.topics[0].subjectId = 'cardiology';
  data.metrics[0].mastery = 99;
  const result = subjectPerformance(data, 'cardiology');
  assert.equal(result.answered, 24);
  assert.equal(result.correct, 10);
  assert.equal(result.incorrect, 14);
  assert.equal(result.accuracy, 42);
  assert.equal(result.topics.length, 1);
  const empty = subjectPerformance(data, 'anatomy');
  assert.equal(empty.accuracy, null);
  data.metrics[0].correct = 0;
  assert.equal(subjectPerformance(data, 'cardiology').accuracy, 0);
  data.metrics[0].correct = 100;
  assert.equal(subjectPerformance(data, 'cardiology').correct, 24);
});

test('review priorities exclude unmeasured concepts and put weaker measured concepts first', () => {
  const data = createSeed();
  data.metrics[0].answered = 0;
  const result = topicsToReview(data);
  assert.deepEqual(
    result.map((item) => item.topic.id),
    ['potassium', 'aki'],
  );
  assert.ok(result.every((item) => item.metric.answered > 0 && item.metric.mastery < 75));
});

test('monthly calendar handles leap days and year changes using recorded study days only', () => {
  const data = createSeed();
  data.user.streak = 25;
  data.sessions.push({
    id: 'unfinished',
    topicId: 'acid',
    startedAt: '2028-02-27T12:00:00',
    minutes: 5,
  });
  data.attempts.push({
    id: 'a',
    questionId: 'q',
    selectedOptionId: 'a',
    correct: true,
    createdAt: '2028-02-29T12:00:00',
  });
  const days = studyMonth(data, '2028-02', '2028-02-29');
  assert.equal(days.filter((day) => day.inMonth).length, 29);
  assert.equal(new Date(`${days[0].date}T12:00:00`).getDay(), 1);
  assert.deepEqual(
    days.filter((day) => day.active).map((day) => day.date),
    ['2028-02-29'],
  );
  assert.equal(days.find((day) => day.date === '2028-02-29')?.today, true);
  assert.equal(shiftStudyMonth('2026-01', -1), '2025-12');
  assert.equal(shiftStudyMonth('2026-12', 1), '2027-01');
});
