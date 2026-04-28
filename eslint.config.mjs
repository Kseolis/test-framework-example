// eslint.config.mjs — flat config (ESLint 9+).
//
// Custom rules tuned for SDET workflow:
//   - no-restricted-syntax flags hard waits, raw fetch/axios in tests, console.* in specs.
//   - typescript-eslint strictness without going overboard.
//
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'tests/api/generated/**',
      '.husky/_/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['tests/**/*.ts', 'playwright.config.ts'],
    plugins: { playwright },
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: { project: false },
    },
    rules: {
      // Tests rules
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-page-pause': 'error',
      'playwright/no-conditional-in-test': 'warn',
      'playwright/no-skipped-test': 'warn',
      'playwright/no-focused-test': 'error',
      'playwright/expect-expect': 'warn',
      'playwright/missing-playwright-await': 'error',

      // TS strictness for tests
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // Custom anti-patterns surfaced as ESLint hints (validators do the hard checks)
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.name='page'][callee.property.name='waitForTimeout']",
          message: 'page.waitForTimeout is forbidden in specs. Use web-first assertions or expect.poll.',
        },
        {
          selector: "ImportDeclaration[source.value='axios']",
          message: 'axios is forbidden in tests. Use the generated typed API client.',
        },
      ],
      'no-restricted-imports': [
        'error',
        { paths: [{ name: 'axios', message: 'Use the generated typed API client instead.' }] },
      ],

      // Hygiene
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
      curly: ['error', 'multi-line'],
    },
  },
  {
    files: ['tests/factories/**/*.ts'],
    rules: {
      // Factories must stay pure
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'No network calls in factories. Move to seed() helper.' },
      ],
      'no-restricted-properties': [
        'error',
        { object: 'Date', property: 'now', message: 'Date.now breaks determinism. Use faker.date.*' },
        { object: 'Math', property: 'random', message: 'Math.random breaks determinism. Use faker.* with SEED.' },
      ],
    },
  },
);
