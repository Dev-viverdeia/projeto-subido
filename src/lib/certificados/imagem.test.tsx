// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { ImageResponse } from 'next/og';
import { criarImagemCertificado } from './imagem';

describe('imagem real do certificado', () => {
  it('renderiza as três marcas locais em PNG sem depender de sessão', async () => {
    const response = await criarImagemCertificado({
      nome: 'Rafael Milagre — CERTIFICADO DE DEMONSTRAÇÃO',
      titulo: 'Atendimento no WhatsApp com IA',
      origem: 'solucao',
      concluido_em: '2026-08-31T12:00:00Z',
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    expect(buffer.subarray(1, 4).toString()).toBe('PNG');
    expect([buffer.readUInt32BE(16), buffer.readUInt32BE(20)]).toEqual([1200, 627]);
  });

  it('propaga uma falha tardia do renderer antes de entregar a resposta HTTP', async () => {
    const lerImagem = vi
      .spyOn(ImageResponse.prototype, 'arrayBuffer')
      .mockRejectedValueOnce(new Error('Falha ao renderizar PNG'));
    try {
      await expect(
        criarImagemCertificado({
          nome: 'Rafael Milagre',
          titulo: 'ChatGPT para o trabalho',
          origem: 'formacao',
          concluido_em: '2026-08-31T12:00:00Z',
        }),
      ).rejects.toThrow('Falha ao renderizar PNG');
    } finally {
      lerImagem.mockRestore();
    }
  });
});
