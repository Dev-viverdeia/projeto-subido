import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const ParametrosSchema = z.object({ arquivo: z.uuid(), projeto: z.uuid() });

function falha(mensagem: string, status: number) {
  return NextResponse.json(
    { erro: mensagem },
    { status, headers: { 'Cache-Control': 'private, no-store' } },
  );
}

export async function GET(request: Request, { params }: { params: Promise<{ arquivo: string }> }) {
  const { arquivo } = await params;
  const validacao = ParametrosSchema.safeParse({
    arquivo,
    projeto: new URL(request.url).searchParams.get('projeto'),
  });
  if (!validacao.success) return falha('Arquivo inválido.', 400);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return falha('Sua sessão expirou.', 401);

  const { data: registro, error } = await supabase
    .from('projeto_arquivos')
    .select('caminho_storage, nome_original')
    .eq('id', validacao.data.arquivo)
    .eq('projeto_execucao_id', validacao.data.projeto)
    .eq('dono', user.id)
    .maybeSingle();
  if (error || !registro) return falha('Arquivo não encontrado.', 404);

  const { data, error: erroUrl } = await supabase.storage
    .from('projeto-entregaveis')
    .createSignedUrl(registro.caminho_storage, 60, { download: registro.nome_original });
  if (erroUrl || !data) return falha('Não foi possível preparar o download.', 503);

  return NextResponse.redirect(data.signedUrl, {
    status: 307,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
