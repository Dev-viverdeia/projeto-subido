import { criarImagemCertificado } from '@/lib/certificados/imagem';

export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') return new Response(null, { status: 404 });
  const longo = new URL(request.url).searchParams.has('longo');
  return criarImagemCertificado(
    {
      nome: longo ? 'Maria Fernanda Albuquerque de Oliveira e Vasconcelos' : 'Rafael Milagre',
      titulo: longo
        ? 'Inteligência artificial aplicada ao atendimento, qualificação de oportunidades e implementação de projetos para empresas'
        : 'ChatGPT para o trabalho',
      concluido_em: '2026-08-29T12:00:00.000Z',
      origem: 'formacao',
    },
    true,
  );
}
