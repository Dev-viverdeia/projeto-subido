import 'server-only';

import { z } from 'zod';
import { handleError } from '@/lib/errors';
import type { Json } from '@/lib/supabase/types.generated';
// Este módulo inteiro é server-only e centraliza a única exceção legítima do
// fluxo: resolver um código público sem abrir SELECT anônimo no banco.
// eslint-disable-next-line no-restricted-imports
import { createAdminClient } from '@/lib/supabase/admin';
import {
  SegmentoLiveSchema,
  mesclarSegmentos,
  textoDaTranscricao,
  type AnaliseCall,
  type RespostaCoach,
  type SegmentoLive,
} from './coach-schema';
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
  const agora = new Date().toISOString();
  const participante = {
    dono,
    reuniao_id: reuniaoId,
    papel,
    nome,
    identidade_provedor: identidade,
    entrou_em: agora,
    saiu_em: null,
    consentiu_gravacao_em: agora,
  };

  const { error } = await admin.from('calls_participantes').insert(participante);

  // O anfitrião mantém a mesma identidade no provedor para não criar pessoas
  // duplicadas no histórico. Ao atualizar a página ou entrar novamente, a
  // restrição única encontra o registro anterior e nós apenas renovamos sua
  // presença e seu consentimento.
  if (error?.code === '23505') {
    const { error: erroReentrada } = await admin
      .from('calls_participantes')
      .update({
        papel,
        nome,
        entrou_em: agora,
        saiu_em: null,
        consentiu_gravacao_em: agora,
      })
      .eq('dono', dono)
      .eq('reuniao_id', reuniaoId)
      .eq('identidade_provedor', identidade);

    if (erroReentrada) throw handleError(erroReentrada, 'calls:reentrada');
    return;
  }

  if (error) throw handleError(error, 'calls:entrada');
}

export async function iniciarReuniao({
  dono,
  reuniaoId,
  iniciadaEm,
}: {
  dono: string;
  reuniaoId: string;
  iniciadaEm: string | null;
}) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('calls_reunioes')
    .update({
      status: 'ao_vivo',
      ...(iniciadaEm ? {} : { iniciada_em: new Date().toISOString() }),
    })
    .eq('id', reuniaoId)
    .eq('dono', dono);
  if (error) throw handleError(error, 'calls:iniciar');
}

const SegmentosSalvosSchema = z.array(SegmentoLiveSchema);

export async function persistirSegmentos({
  dono,
  reuniaoId,
  segmentos,
  concluir = false,
}: {
  dono: string;
  reuniaoId: string;
  segmentos: readonly SegmentoLive[];
  concluir?: boolean;
}): Promise<SegmentoLive[]> {
  const admin = createAdminClient();
  const { data: atual, error: erroLeitura } = await admin
    .from('calls_transcricoes')
    .select('segmentos')
    .eq('reuniao_id', reuniaoId)
    .maybeSingle();
  if (erroLeitura) throw handleError(erroLeitura, 'calls:transcricao:ler');

  const leitura = SegmentosSalvosSchema.safeParse(atual?.segmentos ?? []);
  const mesclados = mesclarSegmentos(leitura.success ? leitura.data : [], segmentos);
  const ultimoSegundo = mesclados.at(-1)?.segundoReuniao ?? null;
  const { error } = await admin.from('calls_transcricoes').upsert(
    {
      dono,
      reuniao_id: reuniaoId,
      status: concluir ? 'concluida' : 'processando',
      segmentos: mesclados as unknown as Json,
      texto_completo: textoDaTranscricao(mesclados) || null,
      idioma: 'pt-BR',
      provedor: 'openai_realtime',
      modelo: 'gpt-live-transcribe',
      duracao_segundos: ultimoSegundo,
      erro: null,
    },
    { onConflict: 'reuniao_id' },
  );
  if (error) throw handleError(error, 'calls:transcricao:salvar');

  return mesclados;
}

export type SugestaoCoachSalva = {
  id: string;
  categoria: string;
  titulo: string;
  sugestao: string;
  metodologia: string | null;
  trecho_gatilho: string | null;
  prioridade: number;
  confianca: number | null;
  status: string;
  criada_em: string;
};

export async function obterSugestaoRecente({
  dono,
  reuniaoId,
}: {
  dono: string;
  reuniaoId: string;
}): Promise<SugestaoCoachSalva | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('calls_coach_sugestoes')
    .select(
      'id, categoria, titulo, sugestao, metodologia, trecho_gatilho, prioridade, confianca, status, criada_em',
    )
    .eq('dono', dono)
    .eq('reuniao_id', reuniaoId)
    .neq('status', 'dispensada')
    .order('criada_em', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw handleError(error, 'calls:coach:recente');
  return data;
}

export async function obterAvaliacaoPorOrigem({
  dono,
  reuniaoId,
  origemItemId,
}: {
  dono: string;
  reuniaoId: string;
  origemItemId: string;
}): Promise<SugestaoCoachSalva | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('calls_coach_sugestoes')
    .select(
      'id, categoria, titulo, sugestao, metodologia, trecho_gatilho, prioridade, confianca, status, criada_em',
    )
    .eq('dono', dono)
    .eq('reuniao_id', reuniaoId)
    .eq('origem_item_id', origemItemId)
    .maybeSingle();
  if (error) throw handleError(error, 'calls:coach:origem');
  return data;
}

export async function obterAvaliacaoRecente({
  dono,
  reuniaoId,
}: {
  dono: string;
  reuniaoId: string;
}): Promise<{ criada_em: string } | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('calls_coach_sugestoes')
    .select('criada_em')
    .eq('dono', dono)
    .eq('reuniao_id', reuniaoId)
    .order('criada_em', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw handleError(error, 'calls:coach:avaliacao-recente');
  return data;
}

export async function persistirSugestao({
  dono,
  reuniaoId,
  origemItemId,
  segundoReuniao,
  resposta,
  modelo,
  respostaId,
}: {
  dono: string;
  reuniaoId: string;
  origemItemId: string;
  segundoReuniao: number;
  resposta: RespostaCoach;
  modelo: string;
  respostaId: string;
}): Promise<SugestaoCoachSalva> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('calls_coach_sugestoes')
    .insert({
      dono,
      reuniao_id: reuniaoId,
      origem_item_id: origemItemId,
      categoria: resposta.categoria,
      titulo: resposta.titulo,
      sugestao: resposta.recomendacao,
      metodologia: resposta.metodologia,
      trecho_gatilho: resposta.trecho_gatilho,
      segundo_reuniao: segundoReuniao,
      prioridade: resposta.prioridade,
      confianca: resposta.confianca,
      status: resposta.intervir ? 'nova' : 'dispensada',
      dados: { modelo, resposta_id: respostaId },
    })
    .select(
      'id, categoria, titulo, sugestao, metodologia, trecho_gatilho, prioridade, confianca, status, criada_em',
    )
    .single();
  if (error?.code === '23505') {
    const existente = await obterAvaliacaoPorOrigem({ dono, reuniaoId, origemItemId });
    if (existente) return existente;
  }
  if (error) throw handleError(error, 'calls:coach:salvar');
  return data;
}

export async function persistirAnalise({
  dono,
  reuniaoId,
  analise,
  modelo,
  respostaId,
}: {
  dono: string;
  reuniaoId: string;
  analise: AnaliseCall;
  modelo: string;
  respostaId: string;
}) {
  const admin = createAdminClient();
  const { error: erroAnalise } = await admin.from('calls_analises').upsert(
    {
      dono,
      reuniao_id: reuniaoId,
      status: 'concluida',
      resumo: analise.resumo,
      dores: analise.dores,
      objecoes: analise.objecoes,
      compromissos: analise.compromissos,
      proximos_passos: analise.proximos_passos,
      oportunidades_projeto: analise.oportunidades_projeto,
      sentimento: analise.sentimento,
      nota_comercial: analise.nota_comercial,
      dados: {
        modelo,
        resposta_id: respostaId,
        versao_analise: 3,
        decisoes: analise.decisoes,
        lacunas: analise.lacunas,
        sinais_compra: analise.sinais_compra,
        briefing_operacional: analise.briefing_operacional,
      },
      erro: null,
    },
    { onConflict: 'reuniao_id' },
  );
  if (erroAnalise) throw handleError(erroAnalise, 'calls:analise:salvar');

  await encerrarReuniao({ dono, reuniaoId });
}

export async function encerrarReuniao({ dono, reuniaoId }: { dono: string; reuniaoId: string }) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('calls_reunioes')
    .update({ status: 'concluida', encerrada_em: new Date().toISOString() })
    .eq('id', reuniaoId)
    .eq('dono', dono);
  if (error) throw handleError(error, 'calls:finalizar');
}

export async function marcarReuniaoProcessando({
  dono,
  reuniaoId,
}: {
  dono: string;
  reuniaoId: string;
}) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('calls_reunioes')
    .update({ status: 'processando', encerrada_em: new Date().toISOString() })
    .eq('id', reuniaoId)
    .eq('dono', dono);
  if (error) throw handleError(error, 'calls:processar');
}

export async function marcarAnaliseComoFalha({
  dono,
  reuniaoId,
  mensagem,
}: {
  dono: string;
  reuniaoId: string;
  mensagem: string;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from('calls_analises').upsert(
    {
      dono,
      reuniao_id: reuniaoId,
      status: 'falhou',
      resumo:
        'A call foi concluída, mas a análise automática não ficou disponível. Revise a transcrição antes de atualizar o CRM.',
      erro: mensagem.slice(0, 500),
    },
    { onConflict: 'reuniao_id' },
  );
  if (error) console.error('[calls:analise:falha] não foi possível registrar:', error.message);
}

export async function marcarAnaliseSemConteudo({
  dono,
  reuniaoId,
}: {
  dono: string;
  reuniaoId: string;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from('calls_analises').upsert(
    {
      dono,
      reuniao_id: reuniaoId,
      status: 'sem_conteudo',
      resumo: null,
      erro: 'A reunião terminou sem fala suficiente para uma análise confiável.',
    },
    { onConflict: 'reuniao_id' },
  );
  if (error) throw handleError(error, 'calls:analise:sem-conteudo');
}
