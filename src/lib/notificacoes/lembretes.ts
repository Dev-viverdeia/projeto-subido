import 'server-only';

import { env } from '@/lib/env';
import { handleError } from '@/lib/errors';
// Worker server-only: a reserva idempotente precisa do papel de serviço e nunca chega ao cliente.
// eslint-disable-next-line no-restricted-imports
import { createAdminClient } from '@/lib/supabase/admin';
import { emailLembreteValidacao } from './entrega-email';
import { enviarNotificacaoEntrega } from './entrega';

export type ResultadoLembretesValidacao = {
  reservados: number;
  enviados: number;
  falharam: number;
};

export async function processarLembretesValidacao(
  limite = 25,
): Promise<ResultadoLembretesValidacao> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('projeto_sistema_reservar_lembretes_aprovacao', {
    p_limite: limite,
  });
  if (error) throw handleError(error, 'notificacoes:reservar-lembretes-validacao');

  const lembretes = data ?? [];
  let proximo = 0;
  let enviados = 0;
  let falharam = 0;

  async function trabalhar() {
    while (proximo < lembretes.length) {
      const lembrete = lembretes[proximo++];
      if (!lembrete) continue;

      try {
        const resultado = await enviarNotificacaoEntrega({
          eventoId: lembrete.evento_id,
          destinatario: lembrete.destinatario,
          conteudo: emailLembreteValidacao({
            empresa: lembrete.empresa,
            projeto: lembrete.projeto,
            tarefa: lembrete.tarefa,
            link: `${env.NEXT_PUBLIC_SITE_URL}/portal/${lembrete.portal_codigo}`,
          }),
        });

        if (resultado.status === 'falhou') falharam += 1;
        else enviados += 1;
      } catch (erro) {
        falharam += 1;
        console.error(
          '[notificacoes:lembrete-validacao]',
          erro instanceof Error ? erro.message : 'falha_inesperada',
        );
      }
    }
  }

  const concorrencia = Math.min(4, lembretes.length);
  await Promise.all(Array.from({ length: concorrencia }, trabalhar));

  return { reservados: lembretes.length, enviados, falharam };
}
