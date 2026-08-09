import { NextResponse } from 'next/server';
import { z } from 'zod';
// O link secreto do portal e a visibilidade deliberada são validados antes de
// assinar o download. Nenhuma policy anônima é criada no bucket.
// eslint-disable-next-line no-restricted-imports
import { createAdminClient } from '@/lib/supabase/admin';

const ParametrosSchema = z.object({ codigo: z.uuid(), arquivo: z.uuid() });

function falha(status: number) {
  return NextResponse.json(
    { erro: 'Este arquivo não está disponível.' },
    { status, headers: { 'Cache-Control': 'private, no-store' } },
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ codigo: string; arquivo: string }> },
) {
  const validacao = ParametrosSchema.safeParse(await params);
  if (!validacao.success) return falha(404);

  const admin = createAdminClient();
  const { data: registro, error } = await admin
    .from('projeto_arquivos')
    .select('projeto_execucao_id, caminho_storage, nome_original')
    .eq('id', validacao.data.arquivo)
    .eq('visivel_cliente', true)
    .maybeSingle();
  if (error || !registro) return falha(404);

  const { data: projeto } = await admin
    .from('projetos_execucao')
    .select('id')
    .eq('id', registro.projeto_execucao_id)
    .eq('portal_codigo', validacao.data.codigo)
    .eq('portal_ativo', true)
    .maybeSingle();
  if (!projeto) return falha(404);

  const { data, error: erroUrl } = await admin.storage
    .from('projeto-entregaveis')
    .createSignedUrl(registro.caminho_storage, 60, { download: registro.nome_original });
  if (erroUrl || !data) return falha(503);

  return NextResponse.redirect(data.signedUrl, {
    status: 307,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
