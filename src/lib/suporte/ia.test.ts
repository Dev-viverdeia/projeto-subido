import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/env', () => ({ openAIEnv: vi.fn() }));
import { conferirResposta, responderAjuda } from './ia';
import { GUIAS_INICIAIS } from './guias-iniciais';

describe('IA de suporte baseada em guias', () => {
  it('remove fonte inventada e duplicada', () => {
    const r = conferirResposta(
      {
        resposta: 'Veja o guia.',
        fontes: ['entrar-na-conta', 'https://evil.test', 'entrar-na-conta'],
        encaminhar: false,
      },
      GUIAS_INICIAIS,
    );
    expect(r.fontes).toEqual(['entrar-na-conta']);
  });
  it('encaminha quando não há fonte válida em vez de inventar', () => {
    const r = conferirResposta(
      { resposta: 'Eu corrigi sua conta.', fontes: ['inventado'], encaminhar: false },
      GUIAS_INICIAIS,
    );
    expect(r.encaminhar).toBe(true);
    expect(r.resposta).not.toContain('corrigi');
  });
  it('não chama modelo sem guia relevante', async () => {
    const r = await responderAjuda('astronauta', [], GUIAS_INICIAIS);
    expect(r.tokens).toBe(0);
    expect(r.resposta.encaminhar).toBe(true);
  });
});
