import 'server-only';

import { RoomServiceClient } from 'livekit-server-sdk';
import { livekitEnv } from '@/lib/env';
import { handleError } from '@/lib/errors';
// Operação interna: a rota valida a sessão/dono; o worker usa a referência persistida.
// eslint-disable-next-line no-restricted-imports
import { createAdminClient } from '@/lib/supabase/admin';

function naoEncontrado(erro: unknown) {
  return typeof erro === 'object' && erro !== null && 'code' in erro && erro.code === 'not_found';
}

export async function solicitarEncerramentoSala(dono: string, reuniaoId: string) {
  const admin = createAdminClient();
  // A mesma transação grava a intenção, bloqueia entradas e cria o job pelo trigger.
  const { data, error } = await admin
    .from('calls_reunioes')
    .update({ encerramento_solicitado_em: new Date().toISOString() })
    .eq('id', reuniaoId)
    .eq('dono', dono)
    .select('id')
    .maybeSingle();
  if (error) throw handleError(error, 'calls:solicitar-encerramento');
  if (!data) throw new Error('reuniao_nao_encontrada');
  const operacao = await admin
    .from('operacoes_jobs')
    .select('id, status')
    .eq('dono', dono)
    .eq('tipo', 'encerramento_sala')
    .eq('chave_idempotencia', `encerrar_sala:${reuniaoId}`)
    .single();
  if (operacao.error) throw handleError(operacao.error, 'calls:encerramento-pendente');
  return operacao.data;
}

export async function encerrarSalaNoProvedor(dono: string, reuniaoId: string) {
  const admin = createAdminClient();
  const { data: reuniao, error } = await admin
    .from('calls_reunioes')
    .select('sala_provedor, status, encerramento_solicitado_em')
    .eq('id', reuniaoId)
    .eq('dono', dono)
    .maybeSingle();
  if (error) throw handleError(error, 'calls:encerramento-contexto');
  if (!reuniao) return { status: 'nao_encontrada' as const };
  if (!reuniao.encerramento_solicitado_em) throw new Error('encerramento_nao_solicitado');
  const configuracao = livekitEnv();
  if (!configuracao) throw new Error('provedor_video_indisponivel');
  if (!new URL(configuracao.LIVEKIT_URL).hostname.endsWith('.livekit.cloud')) {
    throw new Error('provedor_sem_revogacao_de_tokens');
  }
  const cliente = new RoomServiceClient(
    configuracao.LIVEKIT_URL.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:'),
    configuracao.LIVEKIT_API_KEY,
    configuracao.LIVEKIT_API_SECRET,
    { requestTimeout: 8 },
  );
  // Inclui identidades que receberam um token mas nunca chegaram a se conectar.
  // No LiveKit Cloud, removeParticipant também revoga essas credenciais.
  for (let inicio = 0; ; inicio += 200) {
    const { data: participantes, error: erroParticipantes } = await admin
      .from('calls_participantes')
      .select('identidade_provedor')
      .eq('dono', dono)
      .eq('reuniao_id', reuniaoId)
      .order('id')
      .range(inicio, inicio + 199);
    if (erroParticipantes) throw handleError(erroParticipantes, 'calls:revogar-participantes');
    for (let i = 0; i < (participantes?.length ?? 0); i += 8) {
      await Promise.all(
        participantes.slice(i, i + 8).map(async ({ identidade_provedor }) => {
          if (!identidade_provedor) return;
          try {
            // O corte explícito também invalida tokens de quem nunca entrou.
            // Não depender do comportamento implícito de remoção/not_found.
            await cliente.removeParticipant(reuniao.sala_provedor, identidade_provedor, {
              revokeTokenTs: BigInt(Math.floor(Date.now() / 1000) + 30),
            });
          } catch (causa) {
            if (!naoEncontrado(causa)) throw causa;
          }
        }),
      );
    }
    if ((participantes?.length ?? 0) < 200) break;
  }
  try {
    await cliente.deleteRoom(reuniao.sala_provedor);
  } catch (causa) {
    if (!naoEncontrado(causa)) throw causa;
  }
  return {
    status: reuniao.status === 'cancelada' ? ('cancelada' as const) : ('encerrada' as const),
  };
}

export async function reuniaoAguardaEncerramento(reuniaoId: string) {
  const { data, error } = await createAdminClient()
    .from('calls_reunioes')
    .select('encerramento_solicitado_em, status')
    .eq('id', reuniaoId)
    .maybeSingle();
  if (error) throw handleError(error, 'calls:estado-encerramento');
  return Boolean(
    data &&
    data.status !== 'cancelada' &&
    (data.encerramento_solicitado_em || ['processando', 'concluida'].includes(data.status)),
  );
}
