'use client';

import { createClient } from '@/lib/supabase/client';
import type { RegistroTexto, TentativaTexto } from './registrar-envio';

export async function confirmarTexto(
  tentativa: TentativaTexto,
  somenteConferir: boolean,
): Promise<RegistroTexto> {
  const falha = (
    mensagem: string,
    extra?: { tipo?: 'sessao'; ausente?: boolean },
  ): RegistroTexto => ({
    threadId: null,
    mensagemId: null,
    falha: mensagem,
    pendente: tentativa.solicitado,
    ...extra,
  });
  if (!tentativa.mensagem || tentativa.mensagem.length > 8000)
    return falha('Escreva uma pergunta de até 8.000 caracteres.');
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session || (tentativa.dono && tentativa.dono !== session.user.id))
    return falha('Entre novamente na mesma conta para continuar.', { tipo: 'sessao' });
  tentativa.dono = session.user.id;
  const signal = AbortSignal.timeout(15000);
  if (somenteConferir) {
    const { data, error, status } = await supabase
      .from('consultor_mensagens')
      .select('id,thread_id,papel,conteudo,consultor_anexos(id)')
      .eq('id', tentativa.mensagemId)
      .eq('thread_id', tentativa.threadId)
      .setHeader('Authorization', `Bearer ${session.access_token}`)
      .abortSignal(signal)
      .maybeSingle();
    if (error)
      return falha(
        'Não foi possível conferir o envio. Tente novamente.',
        status === 401 ? { tipo: 'sessao' } : undefined,
      );
    if (!data)
      return falha('Ainda não encontramos a confirmação. Retome o mesmo envio.', { ausente: true });
    if (
      data.papel !== 'usuario' ||
      data.conteudo !== tentativa.mensagem ||
      data.consultor_anexos.length
    )
      return falha('Não foi possível recuperar este envio. Abra o histórico para conferir.');
  } else {
    // Marcado ANTES do POST: timeout, erro de rede e ACK inválido são ambíguos.
    tentativa.solicitado = true;
    const { data, error, status } = await supabase
      .rpc('sobral_confirmar_texto', {
        p_thread: tentativa.threadId,
        p_mensagem: tentativa.mensagemId,
        p_conteudo: tentativa.mensagem,
        p_nova: tentativa.nova,
      })
      .setHeader('Authorization', `Bearer ${session.access_token}`)
      .abortSignal(signal);
    if (error || data !== tentativa.mensagemId)
      return falha(
        'Falta confirmar o envio.',
        status === 401 || error?.code === 'PGRST301' ? { tipo: 'sessao' } : undefined,
      );
  }
  return { threadId: tentativa.threadId, mensagemId: tentativa.mensagemId, falha: null };
}
