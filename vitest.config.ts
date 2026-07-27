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
    exclude: ['node_modules/**', '.next/**', 'e2e/**'],
    coverage: {
      provider: 'v8',
      exclude: ['node_modules/**', '.next/**', 'e2e/**', 'src/design-system/**', '*.config.ts'],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
