import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  interpretarQuadro,
  lerQuadro,
  limparQuadrosVendas,
  observarQuadro,
  PREFIXO_QUADRO,
  QUADRO_VAZIO,
  salvarQuadro,
  VALIDADE_QUADRO,
} from './quadro-local';

beforeEach(() => {
  vi.restoreAllMocks();
  limparQuadrosVendas();
});

describe('Preferências temporárias do quadro', () => {
  it('isola contas e preserva só preferências de navegação', () => {
    salvarQuadro('a', { ...QUADRO_VAZIO, busca: 'Aurora', filtro: 'proposta', fase: 'conversa' });
    expect(interpretarQuadro(lerQuadro('a'))).toMatchObject({
      busca: 'Aurora',
      filtro: 'proposta',
      fase: 'conversa',
    });
    expect(interpretarQuadro(lerQuadro('b'))).toEqual(QUADRO_VAZIO);
  });
  it('expira e rejeita dados inválidos ou de versão desconhecida', () => {
    const agora = Date.now();
    for (const raw of [
      'null',
      '{',
      JSON.stringify({ v: 2, em: agora }),
      JSON.stringify({ v: 1, em: agora - VALIDADE_QUADRO - 1 }),
      JSON.stringify({ v: 1, em: agora + 1 }),
    ]) {
      expect(interpretarQuadro(raw, agora)).toEqual(QUADRO_VAZIO);
    }
    expect(
      interpretarQuadro(
        JSON.stringify({
          v: 1,
          em: agora,
          busca: 'a'.repeat(400),
          filtro: 'desconhecido',
          fase: 'x',
          retorno: { id: 'venda-1', href: 'https://externo.com', topo: 0, y: 0 },
        }),
      ),
    ).toEqual({ ...QUADRO_VAZIO, busca: 'a'.repeat(160) });
  });
  it('não perde interações quando o navegador bloqueia o armazenamento', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    const avisar = vi.fn();
    const parar = observarQuadro(avisar);
    salvarQuadro('a', { ...QUADRO_VAZIO, busca: 'Aurora' });
    expect(interpretarQuadro(lerQuadro('a')).busca).toBe('Aurora');
    expect(avisar).toHaveBeenCalledOnce();
    limparQuadrosVendas();
    expect(interpretarQuadro(lerQuadro('a'))).toEqual(QUADRO_VAZIO);
    parar();
  });
  it('limpa todas as contas do quadro, preservando outros dados da aba', () => {
    salvarQuadro('a', QUADRO_VAZIO);
    salvarQuadro('b', QUADRO_VAZIO);
    sessionStorage.setItem('outro-recurso', 'preservar');
    limparQuadrosVendas();
    expect(sessionStorage.getItem(PREFIXO_QUADRO + 'a')).toBeNull();
    expect(sessionStorage.getItem(PREFIXO_QUADRO + 'b')).toBeNull();
    expect(sessionStorage.getItem('outro-recurso')).toBe('preservar');
  });
});
