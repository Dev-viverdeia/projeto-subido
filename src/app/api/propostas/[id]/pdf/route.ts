import { z } from 'zod';
import { obterProposta } from '@/lib/propostas/queries';
import { renderizarPropostaPdf } from '@/lib/propostas/pdf';
import { createClient } from '@/lib/supabase/server';

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

export async function GET(_request: Request, contexto: RouteContext<'/api/propostas/[id]/pdf'>) {
  const { id } = await contexto.params;
  if (!z.uuid().safeParse(id).success) return new Response('Não encontrado.', { status: 404 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response('Não autorizado.', { status: 401 });

  const proposta = await obterProposta(id);
  if (!proposta) return new Response('Não encontrado.', { status: 404 });

  const nome =
    typeof user.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name
      : (user.email ?? 'Profissional de IA');
  const pdf = await renderizarPropostaPdf({ proposta, profissional: nome });
  const arquivo = `proposta-${nomeSeguro(proposta.empresa) || proposta.id}.pdf`;

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
