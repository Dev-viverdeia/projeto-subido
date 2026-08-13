import 'server-only';

import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { handleError } from '@/lib/errors';
import { obterJornadaOperacionalComCliente, type JornadaOperacional } from '@/lib/jornada/queries';
import type { Database } from '@/lib/supabase/types.generated';
import { SinaisSobralSchema, type SinaisSobral } from './direcao';
import { contarAcoesAtrasadas, montarRadarSobral } from './radar';

/**
 * Snapshot pequeno e factual da operação. Nenhuma transcrição ou dado de
 * contato é enviado por padrão; o modelo recebe só o necessário para decidir o
 * próximo passo profissional.
 */
export async function obterSinaisSobral(
  supabase: SupabaseClient<Database>,
  jornadaRecebida?: JornadaOperacional,
): Promise<SinaisSobral> {
  const agora = new Date().toISOString();
  const [oportunidades, empresas, calls, propostas, studio, catalogo, projetos, acoes, jornada] =
    await Promise.all([
      supabase
        .from('crm_oportunidades')
        .select('id, empresa_id, titulo, etapa, proxima_acao, proxima_acao_em, atualizado_em')
        .order('atualizado_em', { ascending: false })
        .limit(500),
      supabase.from('crm_empresas').select('id, nome').limit(500),
      supabase
        .from('calls_reunioes')
        .select('id, status, agendada_para, oportunidade_id, titulo, tipo')
        .order('agendada_para', { ascending: false })
        .limit(500),
      supabase
        .from('propostas')
        .select('id, status, oportunidade_id, empresa_id, titulo, atualizado_em')
        .order('atualizado_em', { ascending: false })
        .limit(500),
      supabase.from('builder_solucoes').select('id, status').limit(300),
      supabase
        .from('solucoes')
        .select('slug, titulo, categoria')
        .eq('status', 'publicado')
        .order('ordem')
        .limit(20),
      supabase
        .from('projetos_execucao')
        .select('id, titulo, status, prazo_em, atualizado_em')
        .order('atualizado_em', { ascending: false })
        .limit(200),
      supabase
        .from('projeto_acoes')
        .select(
          'id, titulo, empresa_id, oportunidade_id, projeto_execucao_id, reuniao_id, prazo_em, status, atualizado_em',
        )
        .order('atualizado_em', { ascending: false })
        .limit(500),
      jornadaRecebida ?? obterJornadaOperacionalComCliente(supabase),
    ]);

  if (oportunidades.error) throw handleError(oportunidades.error, 'sobral:oportunidades');
  if (empresas.error) throw handleError(empresas.error, 'sobral:empresas');
  if (calls.error) throw handleError(calls.error, 'sobral:calls');
  if (propostas.error) throw handleError(propostas.error, 'sobral:propostas');
  if (studio.error) throw handleError(studio.error, 'sobral:studio');
  if (catalogo.error) throw handleError(catalogo.error, 'sobral:catalogo');
  if (projetos.error) throw handleError(projetos.error, 'sobral:projetos');
  if (acoes.error) throw handleError(acoes.error, 'sobral:acoes');

  const linhasOportunidade = oportunidades.data ?? [];
  const linhasCalls = calls.data ?? [];
  const linhasPropostas = propostas.data ?? [];
  const linhasStudio = studio.data ?? [];
  const linhasProjetos = projetos.data ?? [];
  const linhasAcoes = acoes.data ?? [];
  const empresasPorId = new Map((empresas.data ?? []).map((empresa) => [empresa.id, empresa.nome]));
  const abertas = linhasOportunidade.filter(
    (oportunidade) => oportunidade.etapa !== 'ganho' && oportunidade.etapa !== 'perdido',
  );
  const radar = montarRadarSobral({
    agora,
    oportunidades: linhasOportunidade,
    calls: linhasCalls,
    propostas: linhasPropostas,
    projetos: linhasProjetos,
    acoes: linhasAcoes,
    empresasPorId,
  });
  const oportunidadeDoRadar = radar
    .find((item) => item.dominio === 'crm')
    ?.destino.match(/^\/crm\/([^/]+)$/)?.[1];
  const foco =
    abertas.find((oportunidade) => oportunidade.id === oportunidadeDoRadar) ?? abertas[0] ?? null;
  const projetosAtivos = linhasProjetos.filter(
    (projeto) => projeto.status !== 'concluido' && projeto.status !== 'pausado',
  );
  const acoesPendentes = linhasAcoes.filter((acao) => acao.status === 'pendente');

  return SinaisSobralSchema.parse({
    momento: agora,
    oportunidades: {
      total: linhasOportunidade.length,
      abertas: abertas.length,
      semProximaAcao: abertas.filter((oportunidade) => !oportunidade.proxima_acao).length,
      emDescoberta: abertas.filter((oportunidade) => oportunidade.etapa === 'descoberta').length,
      emPropostaOuNegociacao: abertas.filter(
        (oportunidade) => oportunidade.etapa === 'proposta' || oportunidade.etapa === 'negociacao',
      ).length,
      ganhas: linhasOportunidade.filter((oportunidade) => oportunidade.etapa === 'ganho').length,
    },
    calls: {
      total: linhasCalls.length,
      agendadas: linhasCalls.filter(
        (call) =>
          call.status === 'agendada' || call.status === 'aguardando' || call.status === 'ao_vivo',
      ).length,
      concluidas: linhasCalls.filter((call) => call.status === 'concluida').length,
    },
    propostas: {
      total: linhasPropostas.length,
      rascunhos: linhasPropostas.filter((proposta) => proposta.status === 'rascunho').length,
      prontas: linhasPropostas.filter((proposta) => proposta.status === 'pronta').length,
      apresentadas: linhasPropostas.filter((proposta) => proposta.status === 'apresentada').length,
      aceitas: linhasPropostas.filter((proposta) => proposta.status === 'aceita').length,
    },
    studio: {
      total: linhasStudio.length,
      prontos: linhasStudio.filter((projeto) => projeto.status === 'pronta').length,
    },
    projetos: {
      total: linhasProjetos.length,
      ativos: projetosAtivos.length,
      acoesPendentes: acoesPendentes.length,
      acoesAtrasadas: contarAcoesAtrasadas(linhasAcoes, agora),
    },
    jornada: {
      perfilCompleto: jornada.plano.perfilCompleto,
      etapaAtual: jornada.plano.etapaAtual,
      proximoPasso: jornada.plano.proximoPasso,
      evidenciasConcluidas: jornada.plano.evidenciasConcluidas,
      totalEvidencias: jornada.plano.totalEvidencias,
      percentual: jornada.plano.percentual,
      aprendizado: jornada.aprendizado,
    },
    radar,
    catalogo: (catalogo.data ?? []).map((projeto) => ({
      slug: projeto.slug,
      titulo: projeto.titulo,
      categoria: projeto.categoria,
    })),
    foco: foco
      ? {
          oportunidadeId: foco.id,
          titulo: foco.titulo,
          empresa: empresasPorId.get(foco.empresa_id) ?? 'Empresa sem nome disponível',
          etapa: foco.etapa,
          proximaAcao: foco.proxima_acao,
          proximaAcaoEm: foco.proxima_acao_em,
        }
      : null,
  });
}

/** Hash evita regenerar uma leitura idêntica sem guardar o contexto em segredo. */
export function hashDoContexto(sinais: SinaisSobral): string {
  const { momento: _momento, ...fatos } = sinais;
  return createHash('sha256').update(JSON.stringify(fatos)).digest('hex');
}

export function contextoParaModelo(sinais: SinaisSobral): string {
  return JSON.stringify(
    {
      momento: sinais.momento,
      etapa_comercial_em_foco: sinais.foco?.etapa ?? null,
      oportunidade_em_foco: sinais.foco
        ? {
            titulo: sinais.foco.titulo,
            empresa: sinais.foco.empresa,
            proxima_acao: sinais.foco.proximaAcao,
            proxima_acao_em: sinais.foco.proximaAcaoEm,
          }
        : null,
      contadores: {
        oportunidades: sinais.oportunidades,
        calls: sinais.calls,
        propostas: sinais.propostas,
        studio: sinais.studio,
        projetos: sinais.projetos,
        aprendizado: sinais.jornada.aprendizado,
      },
      jornada_profissional: {
        perfil_completo: sinais.jornada.perfilCompleto,
        etapa_atual: sinais.jornada.etapaAtual,
        proximo_passo: sinais.jornada.proximoPasso,
        evidencias_concluidas: sinais.jornada.evidenciasConcluidas,
        total_evidencias: sinais.jornada.totalEvidencias,
        percentual: sinais.jornada.percentual,
      },
      radar_operacional: sinais.radar.map((item) => ({
        dominio: item.dominio,
        titulo: item.titulo,
        contexto: item.contexto,
        momento: item.momento,
      })),
      projetos_disponiveis: sinais.catalogo,
    },
    null,
    2,
  );
}
