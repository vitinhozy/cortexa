const base = require('./eslint.config.js');

// Duas regras medidas no runtime. Registros node:test ficam com seu runner;
// a entrada Deno mantém o typecheck próprio, fora do programa Expo.
module.exports = [
  ...base,
  {
    files: [
      '{app,components,constants,features,hooks,mocks,services,types,utils}/**/*.{ts,tsx}',
      'supabase/functions/_shared/**/*.ts',
    ],
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: __dirname } },
    rules: {
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
    },
  },
];
