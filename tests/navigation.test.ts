import test from 'node:test';
import assert from 'node:assert/strict';
import { navigationLocation } from '../constants/navigation';

test('study tools have a study fallback and nested practice retains its parent', () => {
  for (const path of [
    '/questions',
    '/flashcards',
    '/session',
    '/mistakes',
    '/knowledge',
    '/planner',
    '/exams',
    '/tutor',
  ]) {
    const location = navigationLocation(path);
    assert.equal(location.fallback, '/study', path);
    assert.equal(location.sectionHref, '/study', path);
  }
  const practice = navigationLocation('/practice/session-1');
  assert.equal(practice.fallback, '/questions');
  assert.deepEqual(
    practice.crumbs.map((crumb) => crumb.label),
    ['Estudar', 'Questões', 'Sessão de questões'],
  );
  assert.equal(navigationLocation('/compose', { kind: 'flashcards' }).fallback, '/flashcards');
  assert.equal(navigationLocation('/compose', { kind: 'assessment' }).fallback, '/questions');
});

test('navigation titles keep library formats, profile and topic hierarchy distinct', () => {
  assert.equal(navigationLocation('/').sectionHref, '/overview');
  assert.equal(navigationLocation('/ai').sectionHref, '/ai');
  assert.equal(navigationLocation('/history').sectionHref, '/ai');
  assert.equal(navigationLocation('/history').crumbs[0].label, 'Conversar');
  const document = navigationLocation('/studio/document-1', { kind: 'transcript' }, 'Minha aula');
  assert.deepEqual(document.fallback, { pathname: '/studio', params: { kind: 'transcript' } });
  assert.deepEqual(
    document.crumbs.map((crumb) => crumb.label),
    ['Biblioteca', 'Transcrições', 'Minha aula'],
  );
  assert.equal(navigationLocation('/account').fallback, '/profile');
  assert.equal(navigationLocation('/material/file-1').fallback, '/library');
  assert.equal(navigationLocation('/topic/acid').fallback, '/knowledge');
  assert.equal(navigationLocation('/questions', { kind: 'exam' }).currentLabel, 'Simulado');
});
