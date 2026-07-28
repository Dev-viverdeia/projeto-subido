import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    /**
     * `e2e/` é do Playwright. Sem esta exclusão o Vitest coleta os `.spec.ts` de lá,
     * tenta rodá-los em jsdom e falha com um erro sobre `test.describe` que não
     * aponta em nada para a causa real.
     */
    /**
     * `**\/node_modules/**` e não `node_modules/**`. O padrão sem `**\/` é
     * ancorado na raiz e NÃO cobre `node_modules` aninhado — um worktree do
     * Claude em `.claude/worktrees/*` tem o seu, e o Vitest passava a coletar os
     * testes de terceiros de lá: 16 arquivos e 6 falhas vindas de `zod`, `next`,
     * `@testing-library` e `gensync`, nenhuma delas deste projeto. `npm test` é
     * gate de merge; gate que fica vermelho por causa de dependência alheia
     * ensina a ignorar o vermelho.
     */
    exclude: ['**/node_modules/**', '.next/**', 'e2e/**'],
    coverage: {
      provider: 'v8',
      exclude: ['**/node_modules/**', '.next/**', 'e2e/**', 'src/design-system/**', '*.config.ts'],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
