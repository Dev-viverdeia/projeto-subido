import { describe, expect, it } from 'vitest';
import { avaliarCertificado } from './criterios';

describe('critérios do certificado', () => {
  it('libera uma formação quando todas as aulas foram concluídas', () => {
    const estado = avaliarCertificado(
      { aprendizadoIds: ['aula-1', 'aula-2'], implementacaoIds: [] },
      {
        aprendizado: {
          'aula-1': '2026-08-20T10:00:00.000Z',
          'aula-2': '2026-08-21T10:00:00.000Z',
        },
        implementacao: {},
      },
    );

    expect(estado.concluido).toBe(true);
    expect(estado.percentual).toBe(100);
    expect(estado.concluidoEm).toBe('2026-08-21T10:00:00.000Z');
  });

  it('não certifica um projeto que concluiu as aulas mas não a implementação', () => {
    const estado = avaliarCertificado(
      { aprendizadoIds: ['aula-1'], implementacaoIds: ['passo-1', 'passo-2'] },
      {
        aprendizado: { 'aula-1': '2026-08-20T10:00:00.000Z' },
        implementacao: { 'passo-1': '2026-08-21T10:00:00.000Z' },
      },
    );

    expect(estado.aprendizado.concluido).toBe(true);
    expect(estado.implementacao.concluido).toBe(false);
    expect(estado.concluido).toBe(false);
    expect(estado.percentual).toBe(67);
  });

  it('libera o projeto somente depois das duas partes concluídas', () => {
    const estado = avaliarCertificado(
      { aprendizadoIds: ['aula-1'], implementacaoIds: ['passo-1'] },
      {
        aprendizado: { 'aula-1': '2026-08-20T10:00:00.000Z' },
        implementacao: { 'passo-1': '2026-08-22T10:00:00.000Z' },
      },
    );

    expect(estado.concluido).toBe(true);
    expect(estado.concluidoEm).toBe('2026-08-22T10:00:00.000Z');
  });
});
