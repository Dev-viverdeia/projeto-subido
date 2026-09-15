import { defineConfig, devices } from '@playwright/test';
import base from './playwright.config';

// Matriz pequena e isolada: não altera as premissas desktop/mobile da suíte existente.
export default defineConfig({
  ...base,
  testMatch: 'acabamento-operacional.spec.ts',
  projects: [
    ...base.projects!,
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } },
    },
  ],
});
