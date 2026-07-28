/**
 * ESLint flat config.
 *
 * Two principles, both learned from the reference platform (plataforma-viver-de-ia):
 *
 *   1. NOTHING IS A WARNING. There, `no-console` was a warn and CI never ran lint,
 *      which produced 418 `console.log` calls in src despite a merge checklist
 *      forbidding them. A convention that isn't enforced in CI is a suggestion.
 *
 *   2. NO PATH ALLOWLISTS. There, 250 of 379 config lines were hand-maintained lists
 *      of migrated file paths, duplicated in a second script that had to be kept in
 *      sync by hand. Greenfield has nothing to migrate; the vendored DS is guarded by
 *      a diff (scripts/check-ds-drift.mjs), not by a list.
 */
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'node_modules/**',
      'next-env.d.ts',
      // Estado de ferramenta, não código do projeto. Contém worktrees git em commits
      // antigos, com configs desatualizadas que quebram o lint da raiz.
      '.claude/**',
      // Vendored + generated. Its integrity is a drift check, not a lint pass.
      'src/design-system/via/**',
      'src/lib/supabase/types.generated.ts',
      // Deno, não Node: `npm:`/`jsr:` nos imports, `.ts` no caminho e globais
      // (`Deno`, `EdgeRuntime`) que este config não conhece. Quem as checa é o
      // `deno check` do `npm run check:edge`.
      'supabase/functions/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },

  // Both are already flat-config objects in @next/eslint-plugin-next 16.
  nextPlugin.configs.recommended,
  nextPlugin.configs['core-web-vitals'],

  // `configs['recommended-latest']` is still eslintrc-shaped (plugins as an array);
  // the flat namespace is the one ESLint 10 accepts.
  reactHooks.configs.flat['recommended-latest'],

  {
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],

      // 117 files in the reference exceed 500 lines; the largest is 4,567.
      // Free to enforce now, impossible later.
      'max-lines': ['error', { max: 400, skipBlankLines: true, skipComments: true }],

      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/design-system/via/components/*'],
              message: 'Import from the barrel: @/design-system/via',
            },
            {
              group: ['@/lib/supabase/admin'],
              message: 'The service-role client is server-only. Never import it from a component.',
            },
          ],
        },
      ],

      'no-restricted-syntax': [
        'error',
        {
          // The reference's query-key factory failed because nothing enforced it.
          selector: "Property[key.name='queryKey'] > ArrayExpression",
          message: 'Inline query key. Use the factory in @/lib/query/keys.',
        },
        {
          // In the reference this rule lived in an orphaned .eslintrc file that nothing
          // loaded, and 69 `bg-[#...]` survived. Here it is in the real config.
          selector:
            'Literal[value=/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]',
          message: 'Hardcoded color. Use a --via-* token from the design system.',
        },
      ],
    },
  },

  // Config files and scripts run in Node and are not part of the TS program, so
  // type-aware rules cannot resolve a program for them.
  // NOTE: `rules` must MERGE with disableTypeChecked's — a bare `rules` key after the
  // spread replaces the whole object and silently re-enables every typed rule.
  {
    files: ['*.config.{ts,mjs,js}', 'scripts/**/*.mjs', 'e2e/**/*.ts', 'vitest.setup.ts'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      ...tseslint.configs.disableTypeChecked.languageOptions,
      globals: { ...globals.node },
    },
    rules: {
      ...tseslint.configs.disableTypeChecked.rules,
      'no-console': 'off',
    },
  },

  prettier,
);
