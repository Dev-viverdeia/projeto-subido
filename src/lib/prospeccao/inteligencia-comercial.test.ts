import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/env', () => ({
  openAIEnv: () => {
    throw new Error('não usado neste teste');
  },
}));

import { zodTextFormat } from 'openai/helpers/zod';
import { AnaliseOportunidadesSchema } from './inteligencia-comercial';

describe('formato estruturado da inteligência comercial', () => {
  it('não envia formatos de URL incompatíveis com Structured Outputs', () => {
    const formato = zodTextFormat(AnaliseOportunidadesSchema, 'qualificacao_de_projetos');
    const schema = JSON.stringify(formato);

    expect(schema).not.toContain('"format":"uri"');
    expect(schema).toContain('"fonte_url"');
  });
});
