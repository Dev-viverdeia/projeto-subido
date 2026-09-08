import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/certificados/publico', () => ({ buscarCertificadoPublico: vi.fn() }));
import { buscarCertificadoPublico } from '@/lib/certificados/publico';
import { generateMetadata } from './page';

describe('prévia social verificável', () => {
  it('expõe nome, título e PNG do mesmo registro público', async () => {
    vi.mocked(buscarCertificadoPublico).mockResolvedValue({
      nome: 'João da Silva',
      titulo: 'IA & negócios',
      codigo: 'abc123456789',
      origem: 'formacao',
      slug: 'ia',
      concluido_em: '2026-09-08T12:00:00Z',
      emitido_em: '2026-09-08T12:00:00Z',
    });
    const metadata = await generateMetadata({
      params: Promise.resolve({ codigo: 'abc123456789' }),
      searchParams: Promise.resolve({}),
    });
    expect(metadata.title).toBe('João da Silva · IA & negócios');
    expect(metadata.openGraph?.images).toEqual([
      expect.objectContaining({
        url: '/certificado/abc123456789/imagem',
        width: 1200,
        height: 627,
        type: 'image/png',
      }),
    ]);
    expect(metadata.alternates?.canonical).toBe('/certificado/abc123456789');
  });
  it('não oferece prévia de uma credencial inexistente', async () => {
    vi.mocked(buscarCertificadoPublico).mockResolvedValue(null);
    const metadata = await generateMetadata({
      params: Promise.resolve({ codigo: 'inexistente' }),
      searchParams: Promise.resolve({}),
    });
    expect(metadata.openGraph).toBeUndefined();
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
