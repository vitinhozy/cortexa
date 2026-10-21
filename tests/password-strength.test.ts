import test from 'node:test';
import assert from 'node:assert/strict';
import { passwordStrength } from '../utils/passwordStrength';

test('password guidance distinguishes length, common sequences and long unique phrases', () => {
  assert.equal(passwordStrength(''), 0);
  assert.equal(passwordStrength('Ab1!'), 1);
  assert.equal(passwordStrength('Senha123456!'), 1);
  assert.equal(passwordStrength('Ab1!Ab1!Ab1!'), 1);
  assert.equal(passwordStrength('aulas-2026'), 2);
  assert.equal(passwordStrength('Valvulas!2026'), 3);
  assert.equal(passwordStrength('minhas aulas ficam em outro caderno'), 3);
});
