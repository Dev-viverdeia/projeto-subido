import { z } from 'zod';
import { renderizarPropostaPdf } from '@/lib/propostas/pdf';
import { obterPropostaPublica } from '@/lib/propostas/portal';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function nomeSeguro(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72);
}

export async function GET(_request: Request, contexto: RouteContext<'/api/proposta/[codigo]/pdf'>) {
  const { codigo } = await contexto.params;
  if (!z.uuid().safeParse(codigo).success) return new Response('Não encontrado.', { status: 404 });

  const proposta = await obterPropostaPublica(codigo);
  if (!proposta) return new Response('Não encontrado.', { status: 404 });

  const profissional =
    proposta.documento.fornecedor?.nomeNegocio ??
    proposta.documento.fornecedor?.nomeResponsavel ??
    'Profissional de IA';
  const pdf = await renderizarPropostaPdf({ proposta, profissional });
  const arquivo = `proposta-${nomeSeguro(proposta.documento.cliente.empresa) || proposta.id}.pdf`;

  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${arquivo}"`,
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
