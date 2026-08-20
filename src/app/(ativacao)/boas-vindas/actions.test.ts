import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('ação de conclusão das boas-vindas', () => {
  it('não exporta valores síncronos de um módulo use server', () => {
    const fonte = readFileSync(
      resolve(process.cwd(), 'src/app/(ativacao)/boas-vindas/actions.ts'),
      'utf8',
    );

    expect(fonte).toContain("'use server'");
    expect(fonte).not.toMatch(/export\s+(?:const|let|var|class)\s+/);
    expect(fonte).toMatch(/export\s+async\s+function\s+concluirIntroducao/);
  });
});
