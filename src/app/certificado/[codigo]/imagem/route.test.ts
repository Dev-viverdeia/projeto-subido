// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/certificados/publico', () => ({ buscarCertificadoPublico: vi.fn() }));
vi.mock('@/lib/certificados/imagem', () => ({ criarImagemCertificado: vi.fn() }));
import { buscarCertificadoPublico } from '@/lib/certificados/publico';
import { criarImagemCertificado } from '@/lib/certificados/imagem';
import { GET } from './route';

describe('imagem pública do certificado', () => {
  beforeEach(() => vi.resetAllMocks());
  const chamar = () =>
    GET(new Request('https://example.com/certificado/registro/imagem'), {
      params: Promise.resolve({ codigo: 'registro' }),
    });
  it('gera somente a imagem do registro retornado pela consulta pública', async () => {
    const certificado = {
      nome: 'Pessoa Teste',
      titulo: 'IA aplicada',
      codigo: 'registro',
      origem: 'formacao',
      slug: 'ia',
      concluido_em: '2026-09-08T12:00:00Z',
      emitido_em: '2026-09-08T12:00:00Z',
    };
    vi.mocked(buscarCertificadoPublico).mockResolvedValue(certificado);
    vi.mocked(criarImagemCertificado).mockResolvedValue(
      new Response('png', { headers: { 'Content-Type': 'image/png' } }),
    );
    const resposta = await chamar();
    expect(resposta.status).toBe(200);
    expect(criarImagemCertificado).toHaveBeenCalledWith(certificado);
    expect(resposta.headers.get('Content-Type')).toBe('image/png');
  });
  it('não gera imagem nem certificado fictício para código inexistente', async () => {
    vi.mocked(buscarCertificadoPublico).mockResolvedValue(null);
    const resposta = await chamar();
    expect(resposta.status).toBe(404);
    expect(resposta.headers.get('Cache-Control')).toBe('no-store');
    expect(criarImagemCertificado).not.toHaveBeenCalled();
  });
  it('falha temporária não vira imagem válida ou 404 em cache', async () => {
    vi.mocked(buscarCertificadoPublico).mockRejectedValue(new Error('detalhe interno'));
    const resposta = await chamar();
    expect(resposta.status).toBe(503);
    expect(resposta.headers.get('Cache-Control')).toBe('no-store');
    expect(await resposta.text()).not.toContain('detalhe interno');
  });
});
