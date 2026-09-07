import { NextResponse } from 'next/server';
import { z } from 'zod';
import { SOBRAL_BUCKET_ANEXOS, categoriaDoAnexo } from '@/lib/consultor/anexos-contrato';
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
  if (!validacao.success) return falha('Arquivo inválido.', 400);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return falha('Sua sessão expirou.', 401);

  const { data: registro, error } = await supabase
    .from('consultor_anexos')
    .select('caminho_storage, categoria, tipo_mime, nome, consultor_mensagens!inner(thread_id)')
    .eq('id', validacao.data.anexo)
    .eq('dono', user.id)
    .maybeSingle();
  if (error || !registro) return falha('Arquivo não encontrado.', 404);
  const partes = registro.caminho_storage.split('/');
  // Uploads antigos usavam um UUID próprio no nome do arquivo. A leitura valida
  // a conta e a conversa de origem; as regras mais estritas de novos envios permanecem no banco.
  if (
    partes.length !== 3 ||
    partes[0] !== user.id ||
    !z.uuid().safeParse(partes[1]).success ||
    partes[1] !== registro.consultor_mensagens.thread_id ||
    !z.uuid().safeParse(partes[2]?.slice(0, 36)).success ||
    partes[2]?.[36] !== '-' ||
    partes[2].length <= 37 ||
    !/^[a-zA-Z0-9._-]+$/.test(partes[2])
  )
    return falha('Arquivo não encontrado.', 404);
  if (
    !categoriaDoAnexo(registro.tipo_mime) ||
    categoriaDoAnexo(registro.tipo_mime) !== registro.categoria
  )
    return falha('Formato de arquivo indisponível.', 415);

  const { data, error: erroUrl } = await supabase.storage
    .from(SOBRAL_BUCKET_ANEXOS)
    .createSignedUrl(registro.caminho_storage, 90, {
      download: registro.categoria === 'documento' ? registro.nome : false,
    });
  if (erroUrl || !data) return falha('Não foi possível carregar o arquivo. Tente novamente.', 503);

  return NextResponse.redirect(data.signedUrl, {
    status: 307,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
