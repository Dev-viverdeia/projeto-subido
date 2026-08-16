import 'server-only';

import { revalidatePath } from 'next/cache';
import {
  encerrarReuniao,
  marcarAnaliseComoFalha,
  marcarAnaliseSemConteudo,
  marcarReuniaoProcessando,
  persistirAnalise,
} from '@/lib/calls/admin';
import { obterContextoCoach } from '@/lib/calls/contexto-coach';
import { gerarAnaliseCall } from '@/lib/calls/modelo-coach';
import { obterSegmentosPersistidos, reivindicarAnalise } from '@/lib/calls/processamento-admin';
import { revalidarDirecaoOperacional } from '@/lib/consultor/revalidacao';
// Este worker só roda depois de autenticação ou webhook assinado.
// eslint-disable-next-line no-restricted-imports
import { createAdminClient } from '@/lib/supabase/admin';

export type ResultadoProcessamentoCall =
  'concluida' | 'concluida_sem_analise' | 'ja_processando' | 'nao_encontrada' | 'falhou';

function revalidarCall(reuniaoId: string) {
  revalidatePath('/calls');
  revalidatePath(`/calls/${reuniaoId}`);
  revalidarDirecaoOperacional();
}

/**
 * Worker idempotente do pós-call. Pode ser disparado pelo navegador e pelo
 * webhook sem duplicar custo de IA nem fatos no CRM.
 */
export async function processarPosCall(reuniaoId: string): Promise<ResultadoProcessamentoCall> {
  const contexto = await obterContextoCoach(createAdminClient(), reuniaoId);
  if (!contexto) return 'nao_encontrada';

  const reservada = await reivindicarAnalise({
    dono: contexto.dono,
    reuniaoId: contexto.reuniaoId,
  });
  if (!reservada) return 'ja_processando';

  try {
    await marcarReuniaoProcessando({
      dono: contexto.dono,
      reuniaoId: contexto.reuniaoId,
    });
    const segmentos = await obterSegmentosPersistidos(contexto.reuniaoId);
    const caracteres = segmentos.reduce((total, segmento) => total + segmento.texto.length, 0);

    if (caracteres < 80) {
      await marcarAnaliseSemConteudo({
        dono: contexto.dono,
        reuniaoId: contexto.reuniaoId,
      });
      await encerrarReuniao({ dono: contexto.dono, reuniaoId: contexto.reuniaoId });
      revalidarCall(contexto.reuniaoId);
      return 'concluida_sem_analise';
    }

    const rodada = await gerarAnaliseCall({
      usuarioId: contexto.dono,
      contexto,
      segmentos,
    });
    await persistirAnalise({
      dono: contexto.dono,
      reuniaoId: contexto.reuniaoId,
      analise: rodada.analise,
      modelo: rodada.modelo,
      respostaId: rodada.respostaId,
    });
    revalidarCall(contexto.reuniaoId);
    return 'concluida';
  } catch (causa) {
    console.error('[calls:processamento] falha:', causa);
    await marcarAnaliseComoFalha({
      dono: contexto.dono,
      reuniaoId: contexto.reuniaoId,
      mensagem: causa instanceof Error ? causa.message : 'Falha não classificada.',
    });
    await encerrarReuniao({ dono: contexto.dono, reuniaoId: contexto.reuniaoId }).catch(() => null);
    revalidarCall(contexto.reuniaoId);
    return 'falhou';
  }
}
