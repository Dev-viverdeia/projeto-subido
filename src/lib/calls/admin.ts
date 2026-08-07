import 'server-only';

import { handleError } from '@/lib/errors';
// Este módulo inteiro é server-only e centraliza a única exceção legítima do
// fluxo: resolver um código público sem abrir SELECT anônimo no banco.
// eslint-disable-next-line no-restricted-imports
import { createAdminClient } from '@/lib/supabase/admin';
import type { StatusCall } from './tipos';

export type SalaPrivada = {
  dono: string;
  convite: {
    reuniaoId: string;
    titulo: string;
    agendadaPara: string;
    duracaoMinutos: number;
    status: StatusCall;
    liveCoachAtivo: boolean;
    salaProvedor: string;
    disponivel: boolean;
  };
};

function callPodeAbrir(status: StatusCall) {
  return status === 'agendada' || status === 'aguardando' || status === 'ao_vivo';
}

export async function lerSalaPeloCodigo(codigo: string): Promise<SalaPrivada | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(codigo)) {
    return null;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('calls_reunioes')
    .select(
      'id, dono, titulo, agendada_para, duracao_minutos, status, live_coach_ativo, sala_provedor',
    )
    .eq('codigo_publico', codigo)
    .maybeSingle();
  if (error) throw handleError(error, 'calls:convite');
  if (!data) return null;

  const inicio = new Date(data.agendada_para).getTime();
  const agora = Date.now();
  const disponivel =
    callPodeAbrir(data.status) &&
    agora >= inicio - 30 * 60_000 &&
    agora <= inicio + (data.duracao_minutos + 60) * 60_000;

  return {
    dono: data.dono,
    convite: {
      reuniaoId: data.id,
      titulo: data.titulo,
      agendadaPara: data.agendada_para,
      duracaoMinutos: data.duracao_minutos,
      status: data.status,
      liveCoachAtivo: data.live_coach_ativo,
      salaProvedor: data.sala_provedor,
      disponivel,
    },
  };
}

export async function registrarEntradaNaSala({
  dono,
  reuniaoId,
  papel,
  nome,
  identidade,
}: {
  dono: string;
  reuniaoId: string;
  papel: 'anfitriao' | 'convidado';
  nome: string;
  identidade: string;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from('calls_participantes').insert({
    dono,
    reuniao_id: reuniaoId,
    papel,
    nome,
    identidade_provedor: identidade,
    consentiu_gravacao_em: new Date().toISOString(),
  });

  if (error) throw handleError(error, 'calls:entrada');
}
