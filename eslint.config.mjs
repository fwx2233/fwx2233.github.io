import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['assets/**', 'node_modules/**', '_site/**', 'vendor/**', '_js/lib/**'] },
  {
    ...js.configs.recommended,
    files: ['_js/src/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, process: 'readonly' },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { caughtErrors: 'none' }],
    },
  },
  {
    ...js.configs.recommended,
    files: ['webpack.config.js', '.scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: globals.node,
    },
  },
];
