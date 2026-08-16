import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { handleError } from '@/lib/errors';
import type { Database } from '@/lib/supabase/types.generated';

export type GravacaoPosCall = {
  status: string;
  urlTemporaria: string | null;
  duracaoSegundos: number | null;
  tamanhoBytes: number | null;
  mimeType: string;
  atualizadaEm: string;
};

export async function obterGravacaoPosCall(
  supabase: SupabaseClient<Database>,
  reuniaoId: string,
): Promise<GravacaoPosCall | null> {
  const { data, error } = await supabase
    .from('calls_gravacoes')
    .select('status, caminho_arquivo, duracao_segundos, tamanho_bytes, mime_type, atualizada_em')
    .eq('reuniao_id', reuniaoId)
    .maybeSingle();
  if (error) throw handleError(error, 'calls:pos-call:gravacao');
  if (!data) return null;

  let urlTemporaria: string | null = null;
  if (data.status === 'concluida' && data.caminho_arquivo) {
    const assinatura = await supabase.storage
      .from('call-gravacoes')
      .createSignedUrl(data.caminho_arquivo, 60 * 60);
    if (!assinatura.error) urlTemporaria = assinatura.data.signedUrl;
  }

  return {
    status: data.status,
    urlTemporaria,
    duracaoSegundos: data.duracao_segundos,
    tamanhoBytes: data.tamanho_bytes,
    mimeType: data.mime_type,
    atualizadaEm: data.atualizada_em,
  };
}
