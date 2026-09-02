import { NextResponse } from 'next/server';
import { z } from 'zod';
import { SOBRAL_BUCKET_ANEXOS } from '@/lib/consultor/anexos-contrato';
import { createClient } from '@/lib/supabase/server';

const ParametrosSchema = z.object({ anexo: z.uuid() });

function falha(mensagem: string, status: number) {
  return NextResponse.json(
    { erro: mensagem },
    { status, headers: { 'Cache-Control': 'private, no-store' } },
  );
}

export async function GET(_: Request, { params }: { params: Promise<{ anexo: string }> }) {
  const validacao = ParametrosSchema.safeParse(await params);
  if (!validacao.success) return falha('Áudio inválido.', 400);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return falha('Sua sessão expirou.', 401);

  const { data: registro, error } = await supabase
    .from('consultor_anexos')
    .select('caminho_storage, categoria')
    .eq('id', validacao.data.anexo)
    .eq('dono', user.id)
    .maybeSingle();
  if (error || !registro) return falha('Áudio não encontrado.', 404);
  if (registro.categoria !== 'audio') return falha('Este anexo não é um áudio.', 415);

  const { data, error: erroUrl } = await supabase.storage
    .from(SOBRAL_BUCKET_ANEXOS)
    .createSignedUrl(registro.caminho_storage, 90);
  if (erroUrl || !data) return falha('Não foi possível carregar o áudio.', 503);

  return NextResponse.redirect(data.signedUrl, {
    status: 307,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
