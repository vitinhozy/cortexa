import test from 'node:test';
import assert from 'node:assert/strict';
import { isPublicPath, requestedStudyPath, safeReturnPath } from '../services/authAccess';

test('return destinations remain inside the private app and reject redirect loops', () => {
  for (const path of [
    'https://evil.invalid',
    '//evil.invalid/ai',
    '/\\evil.invalid',
    '/account?next=/ai',
    '/',
    '/profile/../account',
    '/%2f%2fevil.invalid',
    '/ai%5ctest',
    '/ai\n',
    '/%E0%A4%A',
  ])
    assert.equal(safeReturnPath(path), undefined, path);
  assert.equal(
    safeReturnPath('/questions?topicId=acid&kind=exam'),
    '/questions?topicId=acid&kind=exam',
  );
  assert.equal(safeReturnPath('/material/note-1'), '/material/note-1');
  assert.equal(isPublicPath('/'), true);
  assert.equal(isPublicPath('/account'), true);
  assert.equal(isPublicPath('/ai'), false);
});

test('protected deep links retain their query without double encoding', () => {
  assert.equal(
    requestedStudyPath('/questions', { topicId: 'acid', kind: 'exam' }),
    '/questions?topicId=acid&kind=exam',
  );
  assert.equal(
    requestedStudyPath('/studio', { kind: 'mindmap', ignored: undefined }),
    '/studio?kind=mindmap',
  );
});
