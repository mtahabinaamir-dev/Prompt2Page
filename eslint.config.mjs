import globals from 'globals';

export default [
  {
    ignores: ['node_modules/', 'generated/', 'exports/', '.git/'],
  },
  {
    languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs', globals: globals.node },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-redeclare': 'error',
    },
  },
];
