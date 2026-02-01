/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: { es2022: true, node: true, browser: true },
  extends: ['eslint:recommended', 'plugin:import/recommended', 'prettier'],
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: ['plugin:@typescript-eslint/recommended'],
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      rules: {
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      },
    },
  ],
  settings: { 'import/resolver': { typescript: true } },
  rules: {
    'import/order': ['error', { 'newlines-between': 'always' }],
  },
};
