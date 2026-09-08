import { buscarCertificadoPublico } from '@/lib/certificados/publico';
import { criarImagemCertificado } from '@/lib/certificados/imagem';

export async function GET(_request: Request, { params }: { params: Promise<{ codigo: string }> }) {
  try {
    const certificado = await buscarCertificadoPublico((await params).codigo);
    if (!certificado)
      return new Response('Certificado não encontrado.', {
        status: 404,
        headers: { 'Cache-Control': 'no-store' },
      });
    return await criarImagemCertificado(certificado);
  } catch {
    return new Response('Não foi possível carregar a imagem. Tente novamente.', {
      status: 503,
      headers: { 'Cache-Control': 'no-store', 'Retry-After': '30' },
    });
  }
}
