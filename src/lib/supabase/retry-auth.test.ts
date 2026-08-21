import { describe, expect, it, vi } from 'vitest';
import { ErroVisivel } from '@/lib/errors';
import { ehJwtEmitidoNoFuturo, repetirAposSincronizarRelogio } from './retry-auth';

describe('tolerância ao relógio da sessão', () => {
  it('reconhece o erro transitório mesmo depois de traduzido', () => {
    const erro = new ErroVisivel('Tente novamente.', {
      code: 'PGRST303',
      message: 'JWT issued at future',
    });

    expect(ehJwtEmitidoNoFuturo(erro)).toBe(true);
  });

  it('aguarda e repete uma única vez', async () => {
    const operacao = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce({ code: 'PGRST303', message: 'JWT issued at future' })
      .mockResolvedValueOnce('carregado');
    const esperar = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);

    await expect(repetirAposSincronizarRelogio(operacao, esperar)).resolves.toBe('carregado');
    expect(operacao).toHaveBeenCalledTimes(2);
    expect(esperar).toHaveBeenCalledWith(1_200);
  });

  it('não repete falhas permanentes', async () => {
    const operacao = vi.fn<() => Promise<string>>().mockRejectedValue(new Error('indisponível'));
    const esperar = vi.fn<() => Promise<void>>();

    await expect(repetirAposSincronizarRelogio(operacao, esperar)).rejects.toThrow('indisponível');
    expect(operacao).toHaveBeenCalledTimes(1);
    expect(esperar).not.toHaveBeenCalled();
  });
});
