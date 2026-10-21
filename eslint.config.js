const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const quality = require('./eslint-rules/index.cjs');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'dist/**',
      '.expo/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      '.agents/**',
      'graphify-out/**',
      'supabase/.temp/**',
    ],
  },
  { files: ['**/*.ts', '**/*.tsx'], rules: { '@typescript-eslint/no-explicit-any': 'error' } },
  { files: ['**/*.cjs'], languageOptions: { globals: { __dirname: 'readonly' } } },
  {
    files: [
      '{app,components,constants,features,hooks,mocks,services,types,utils,tests}/**/*.{ts,tsx}',
      'supabase/functions/_shared/**/*.ts',
    ],
    plugins: { quality },
    rules: { 'quality/no-direct-console': 'error' },
  },
]);
