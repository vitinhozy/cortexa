import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeed } from '../mocks/seed';
import {
  generatePlan,
  masteryLabel,
  recommendTopics,
  scheduleReview,
} from '../features/study/engine';
import { addDays, localDate } from '../utils/date';
test('Study Engine prioritizes acid-base and potassium over high mastery', () => {
  const ranking = recommendTopics(createSeed());
  assert.equal(ranking[0].topic.id, 'acid');
  assert.equal(ranking[1].topic.id, 'potassium');
  assert.ok(
    ranking.findIndex((t) => t.topic.id === 'acid') <
      ranking.findIndex((t) => t.topic.id === 'filtration'),
  );
});
test('mastery boundaries match the four product categories', () => {
  assert.equal(masteryLabel(49), 'Precisa revisar');
  assert.equal(masteryLabel(50), 'Em desenvolvimento');
  assert.equal(masteryLabel(74), 'Em desenvolvimento');
  assert.equal(masteryLabel(75), 'Bom domínio');
  assert.equal(masteryLabel(89), 'Bom domínio');
  assert.equal(masteryLabel(90), 'Domínio alto');
});
test('plans never exceed daily budget, handle small budgets and respect selected topics', () => {
  const data = createSeed();
  for (const minutes of [5, 30, 60, 120, 180, 480]) {
    const blocks = generatePlan(
      data,
      ['acid', 'potassium', 'aki'],
      minutes,
      addDays(localDate(), 6),
    );
    const days = [...new Set(blocks.map((b) => b.day))];
    assert.equal(days.length, 6);
    days.forEach((day) =>
      assert.equal(
        blocks.filter((b) => b.day === day).reduce((sum, b) => sum + b.minutes, 0),
        minutes,
      ),
    );
    assert.ok(
      blocks.every((b) => b.minutes > 0 && ['acid', 'potassium', 'aki'].includes(b.topicId)),
    );
    assert.equal(blocks[0].topicId, 'acid');
  }
  assert.deepEqual(generatePlan(data, [], 30, localDate()), []);
  assert.deepEqual(generatePlan(data, ['acid'], NaN, localDate()), []);
});
test('review scheduler gives failed cards an immediate retry and expands good intervals', () => {
  const card = createSeed().flashcards[0];
  const now = new Date('2026-10-16T12:00:00Z');
  assert.equal(scheduleReview(card, 'again', now).dueAt, '2026-10-16T12:10:00.000Z');
  assert.equal(scheduleReview(card, 'hard', now).intervalDays, 1);
  assert.equal(scheduleReview(card, 'good', now).intervalDays, 3);
  assert.equal(scheduleReview({ ...card, intervalDays: 7 }, 'easy', now).intervalDays, 21);
});
