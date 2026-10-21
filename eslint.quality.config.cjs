const base = require('./eslint.config.js');

// Diagnóstico de adoção: não substitui o gate existente com zero warnings.
module.exports = [
  ...base,
  {
    files: [
      '{app,components,constants,features,hooks,mocks,services,types,utils,tests}/**/*.{ts,tsx}',
      'supabase/functions/_shared/**/*.ts',
    ],
    rules: {
      'quality/max-lines': ['warn', { max: 350 }],
      'quality/no-direct-data-access': [
        'warn',
        {
          modules: [
            '@supabase/supabase-js',
            '@/services/supabase',
            './supabase',
            '../services/supabase',
          ],
          bindings: ['supabase', 'createClient'],
          layers: ['/app/', '/components/'],
          extensions: ['.tsx'],
        },
      ],
    },
  },
];
