import 'server-only';

import { cache } from 'react';
import { handleError } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/supabase/types.generated';
import { lerDossie, lerFontes, type StatusEnriquecimento } from './enriquecimento';
import type { DossieLead, ProjetoDossie } from './dossie-types';
import type { EtapaCrm } from './etapas';
import { projetoSugeridoDaProspeccao } from './projeto-sugerido';

export type {
  AcaoPlanoDossie,
  CallDossieLead,
  DossieLead,
  EventoDossie,
  ExecucaoEnriquecimento,
  ProjetoAtivoDossie,
  ProjetoDossie,
  PropostaDossie,
} from './dossie-types';

type LinhaOportunidade = Tables<'crm_oportunidades'>;

export type OportunidadeCrm = {
  id: string;
  titulo: string;
  etapa: EtapaCrm;
  empresaId: string;
  empresa: string;
  dominio: string | null;
  enriquecidoEm: string | null;
  enriquecimentoStatus: StatusEnriquecimento | null;
  contatoId: string | null;
  contato: string | null;
  contatoEmail: string | null;
  valorCentavos: number | null;
  proximaAcao: string | null;
  proximaAcaoEm: string | null;
  ganhaEm: string | null;
  perdidaEm: string | null;
  motivoPerda: string | null;
  ultimoFato: string | null;
  ultimoFatoEm: string | null;
  atualizadoEm: string;
  criadoEm: string;
};

/**
 * Recorte leve para seletores que só precisam identificar a oportunidade.
 *
 * Calls e propostas não precisam carregar eventos e análises de
 * enriquecimento para abrir um formulário. Manter essa leitura separada evita
 * duas consultas e reduz o tempo até a primeira interação nessas rotas.
 */
export type OportunidadeSeletor = Pick<
  OportunidadeCrm,
  'id' | 'titulo' | 'etapa' | 'empresa' | 'dominio' | 'contato'
> & {
  contatoEmail?: string | null;
  /** Só a Início consome; os seletores existentes podem omitir nos fixtures. */
  proximaAcao?: string | null;
};

export const listarOportunidadesSeletor = cache(async (): Promise<OportunidadeSeletor[]> => {
  const supabase = await createClient();
  const oportunidades = await supabase
    .from('crm_oportunidades')
    .select(
      `
        id,
        titulo,
        etapa,
        ordem,
        proxima_acao,
        empresa:crm_empresas!crm_oportunidades_empresa_fk(nome, dominio),
        contato:crm_contatos!crm_oportunidades_contato_fk(nome, email)
      `,
    )
    .order('ordem', { ascending: false })
    .limit(300);

  if (oportunidades.error) {
    throw handleError(oportunidades.error, 'crm:seletor-oportunidades');
  }

  return (oportunidades.data ?? []).map((oportunidade) => ({
    id: oportunidade.id,
    titulo: oportunidade.titulo,
    etapa: oportunidade.etapa,
    empresa: oportunidade.empresa?.nome ?? 'Empresa não encontrada',
    dominio: oportunidade.empresa?.dominio ?? null,
    contato: oportunidade.contato?.nome ?? null,
    contatoEmail: oportunidade.contato?.email ?? null,
    proximaAcao: oportunidade.proxima_acao,
  }));
});

/**
 * Recorte da oportunidade em foco usado na Início.
 *
 * Antes esta área carregava o pipeline completo — oportunidades, eventos e
 * enriquecimentos — apenas para mostrar empresa, contato e próxima ação. O
 * seletor já traz tudo isso em uma única leitura leve e mantém a mesma ordem.
 */
export const obterFocoLeveDoCrm = cache(async (): Promise<OportunidadeSeletor | null> => {
  const oportunidades = await listarOportunidadesSeletor();
  return (
    oportunidades.find((item) => item.etapa !== 'ganho' && item.etapa !== 'perdido') ??
    oportunidades.find((item) => item.etapa === 'ganho') ??
    null
  );
});

/**
 * Pipeline privado do profissional.
 *
 * As quatro leituras viajam em paralelo. Elas ficam separadas em vez de um join
 * profundo porque as FKs compostas (a barreira contra vínculo entre contas)
 * tornam o payload inferido do PostgREST desnecessariamente complexo. Aqui os
 * mapas deixam a montagem linear e o contrato devolvido à tela fica pequeno.
 */
export const listarPipeline = cache(async (): Promise<OportunidadeCrm[]> => {
  const supabase = await createClient();

  const [oportunidades, eventos, enriquecimentos] = await Promise.all([
    supabase
      .from('crm_oportunidades')
      .select(
        `
          id,
          titulo,
          etapa,
          empresa_id,
          contato_principal_id,
          valor_centavos,
          proxima_acao,
          proxima_acao_em,
          ganha_em,
          perdida_em,
          motivo_perda,
          atualizado_em,
          criado_em,
          ordem,
          empresa:crm_empresas!crm_oportunidades_empresa_fk(nome, dominio, enriquecido_em),
          contato:crm_contatos!crm_oportunidades_contato_fk(nome, email)
        `,
      )
      .order('ordem', { ascending: false })
      .limit(300),
    supabase
      .from('crm_eventos')
      .select('oportunidade_id, titulo, ocorrido_em')
      .order('ocorrido_em', { ascending: false })
      .limit(800),
    supabase
      .from('crm_enriquecimentos')
      .select('oportunidade_id, status, solicitado_em')
      .order('solicitado_em', { ascending: false })
      .limit(500),
  ]);

  if (oportunidades.error) throw handleError(oportunidades.error, 'crm:pipeline');
  if (eventos.error) throw handleError(eventos.error, 'crm:eventos');
  if (enriquecimentos.error) {
    throw handleError(enriquecimentos.error, 'crm:enriquecimentos');
  }

  const ultimoFatoPorOportunidade = new Map<string, { titulo: string; ocorrido_em: string }>();
  const enriquecimentoPorOportunidade = new Map<string, StatusEnriquecimento>();

  /* A query já veio decrescente. O primeiro evento visto é o mais recente. */
  for (const evento of eventos.data ?? []) {
    if (!ultimoFatoPorOportunidade.has(evento.oportunidade_id)) {
      ultimoFatoPorOportunidade.set(evento.oportunidade_id, evento);
    }
  }
  for (const enriquecimento of enriquecimentos.data ?? []) {
    if (!enriquecimentoPorOportunidade.has(enriquecimento.oportunidade_id)) {
      enriquecimentoPorOportunidade.set(enriquecimento.oportunidade_id, enriquecimento.status);
    }
  }

  return (oportunidades.data ?? []).map((linha) =>
    montarOportunidade(linha, ultimoFatoPorOportunidade, enriquecimentoPorOportunidade),
  );
});

function montarOportunidade(
  linha: Pick<
    LinhaOportunidade,
    | 'id'
    | 'titulo'
    | 'etapa'
    | 'empresa_id'
    | 'contato_principal_id'
    | 'valor_centavos'
    | 'proxima_acao'
    | 'proxima_acao_em'
    | 'ganha_em'
    | 'perdida_em'
    | 'motivo_perda'
    | 'atualizado_em'
    | 'criado_em'
  > & {
    empresa: { nome: string; dominio: string | null; enriquecido_em: string | null } | null;
    contato: { nome: string; email: string | null } | null;
  },
  eventos: Map<string, { titulo: string; ocorrido_em: string }>,
  enriquecimentos: Map<string, StatusEnriquecimento>,
): OportunidadeCrm {
  const evento = eventos.get(linha.id);

  return {
    id: linha.id,
    titulo: linha.titulo,
    etapa: linha.etapa,
    empresaId: linha.empresa_id,
    empresa: linha.empresa?.nome ?? 'Empresa não encontrada',
    dominio: linha.empresa?.dominio ?? null,
    enriquecidoEm: linha.empresa?.enriquecido_em ?? null,
    enriquecimentoStatus: enriquecimentos.get(linha.id) ?? null,
    contatoId: linha.contato_principal_id,
    contato: linha.contato?.nome ?? null,
    contatoEmail: linha.contato?.email ?? null,
    valorCentavos: linha.valor_centavos,
    proximaAcao: linha.proxima_acao,
    proximaAcaoEm: linha.proxima_acao_em,
    ganhaEm: linha.ganha_em,
    perdidaEm: linha.perdida_em,
    motivoPerda: linha.motivo_perda,
    ultimoFato: evento?.titulo ?? null,
    ultimoFatoEm: evento?.ocorrido_em ?? null,
    atualizadoEm: linha.atualizado_em,
    criadoEm: linha.criado_em,
  };
}

/**
 * Dossiê de uma oportunidade. Todas as leituras seguem a sessão e a RLS; um UUID
 * de outra conta é indistinguível de um UUID inexistente.
 */
export const obterDossieLead = cache(async (id: string): Promise<DossieLead | null> => {
  const supabase = await createClient();
  const { data: linha, error } = await supabase
    .from('crm_oportunidades')
    .select(
      'id, titulo, etapa, empresa_id, contato_principal_id, valor_centavos, proxima_acao, proxima_acao_em, ganha_em, perdida_em, motivo_perda, atualizado_em, criado_em',
    )
    .eq('id', id)
    .maybeSingle();

  if (error) throw handleError(error, 'crm:dossie-oportunidade');
  if (!linha) return null;

  const [
    empresa,
    contato,
    eventos,
    enriquecimentos,
    calls,
    acoesPlano,
    projetosRecentes,
    propostaRecente,
    carteira,
  ] = await Promise.all([
    supabase
      .from('crm_empresas')
      .select('id, nome, dominio, setor, porte, cidade, estado, enriquecido_em, enriquecimento')
      .eq('id', linha.empresa_id)
      .single(),
    linha.contato_principal_id
      ? supabase
          .from('crm_contatos')
          .select('id, nome, email, telefone, cargo, linkedin_url')
          .eq('id', linha.contato_principal_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from('crm_eventos')
      .select('id, titulo, descricao, tipo, ocorrido_em, fonte')
      .eq('oportunidade_id', id)
      .order('ocorrido_em', { ascending: false })
      .limit(30),
    supabase
      .from('crm_enriquecimentos')
      .select(
        'id, status, dominio, linkedin_url, erro, solicitado_em, concluido_em, resultado, fontes',
      )
      .eq('oportunidade_id', id)
      .order('solicitado_em', { ascending: false })
      .limit(10),
    supabase
      .from('calls_reunioes')
      .select(
        'id, titulo, tipo, status, agendada_para, iniciada_em, encerrada_em, duracao_minutos, codigo_publico',
        { count: 'exact' },
      )
      .eq('oportunidade_id', id)
      .order('agendada_para', { ascending: false })
      .limit(6),
    supabase
      .from('projeto_acoes')
      .select('id, titulo, prazo_em, reuniao_id, atualizado_em')
      .eq('oportunidade_id', id)
      .eq('status', 'pendente')
      .order('prazo_em', { ascending: true, nullsFirst: false })
      .order('atualizado_em', { ascending: false })
      .limit(6),
    supabase
      .from('projetos_execucao')
      .select('id, titulo, status, atualizado_em')
      .eq('oportunidade_id', id)
      .order('atualizado_em', { ascending: false })
      .limit(10),
    supabase
      .from('propostas')
      .select('id, titulo, status, reuniao_id')
      .eq('oportunidade_id', id)
      .order('atualizado_em', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('prospeccao_carteiras').select('saldo').maybeSingle(),
  ]);

  if (empresa.error) throw handleError(empresa.error, 'crm:dossie-empresa');
  if (contato.error) throw handleError(contato.error, 'crm:dossie-contato');
  if (eventos.error) throw handleError(eventos.error, 'crm:dossie-eventos');
  if (enriquecimentos.error) {
    throw handleError(enriquecimentos.error, 'crm:dossie-enriquecimentos');
  }
  if (calls.error) throw handleError(calls.error, 'crm:dossie-calls');
  if (acoesPlano.error) throw handleError(acoesPlano.error, 'crm:dossie-plano');
  if (projetosRecentes.error) throw handleError(projetosRecentes.error, 'crm:dossie-projetos');
  if (propostaRecente.error) throw handleError(propostaRecente.error, 'crm:dossie-proposta');
  if (carteira.error) throw handleError(carteira.error, 'crm:dossie-creditos');

  const empresaLinha = empresa.data;
  if (!empresaLinha) return null;

  const ultimaExecucao = enriquecimentos.data?.[0];
  const ultimoEvento = eventos.data?.[0];
  const eventoPorOportunidade = new Map(
    ultimoEvento
      ? [[id, { titulo: ultimoEvento.titulo, ocorrido_em: ultimoEvento.ocorrido_em }]]
      : [],
  );
  const statusPorOportunidade = new Map<string, StatusEnriquecimento>(
    ultimaExecucao ? [[id, ultimaExecucao.status]] : [],
  );

  const mapearProjeto = (
    projeto: NonNullable<typeof projetosRecentes.data>[number] | null,
  ): ProjetoDossie | null =>
    projeto
      ? {
          id: projeto.id,
          titulo: projeto.titulo,
          status: projeto.status,
          atualizadoEm: projeto.atualizado_em,
        }
      : null;
  const projetoRecente = projetosRecentes.data?.[0] ?? null;
  const projetoAtivo =
    projetosRecentes.data?.find((projeto) => projeto.status !== 'concluido') ?? null;

  return {
    saldoCreditos: carteira.data?.saldo ?? 30,
    oportunidade: montarOportunidade(
      {
        ...linha,
        empresa: {
          nome: empresaLinha.nome,
          dominio: empresaLinha.dominio,
          enriquecido_em: empresaLinha.enriquecido_em,
        },
        contato: contato.data ? { nome: contato.data.nome, email: contato.data.email } : null,
      },
      eventoPorOportunidade,
      statusPorOportunidade,
    ),
    empresa: {
      nome: empresaLinha.nome,
      dominio: empresaLinha.dominio,
      setor: empresaLinha.setor,
      porte: empresaLinha.porte,
      cidade: empresaLinha.cidade,
      estado: empresaLinha.estado,
      projetoSugeridoSlug: projetoSugeridoDaProspeccao(empresaLinha.enriquecimento),
    },
    contato: contato.data
      ? {
          nome: contato.data.nome,
          email: contato.data.email,
          telefone: contato.data.telefone,
          cargo: contato.data.cargo,
          linkedinUrl: contato.data.linkedin_url,
        }
      : null,
    eventos: (eventos.data ?? []).map((evento) => ({
      id: evento.id,
      titulo: evento.titulo,
      descricao: evento.descricao,
      tipo: evento.tipo,
      ocorridoEm: evento.ocorrido_em,
      fonte: evento.fonte,
    })),
    calls: (calls.data ?? []).map((call) => ({
      id: call.id,
      titulo: call.titulo,
      tipo: call.tipo,
      status: call.status,
      agendadaPara: call.agendada_para,
      iniciadaEm: call.iniciada_em,
      encerradaEm: call.encerrada_em,
      duracaoMinutos: call.duracao_minutos,
      codigoPublico: call.codigo_publico,
    })),
    acoesPlano: (acoesPlano.data ?? []).map((acao) => ({
      id: acao.id,
      titulo: acao.titulo,
      prazoEm: acao.prazo_em,
      reuniaoId: acao.reuniao_id,
    })),
    projetoAtivo: mapearProjeto(projetoAtivo),
    projetoRecente: mapearProjeto(projetoRecente),
    propostaRecente: propostaRecente.data
      ? {
          id: propostaRecente.data.id,
          titulo: propostaRecente.data.titulo,
          status: propostaRecente.data.status,
          reuniaoId: propostaRecente.data.reuniao_id,
        }
      : null,
    enriquecimentos: (enriquecimentos.data ?? []).map((execucao) => ({
      id: execucao.id,
      status: execucao.status,
      dominio: execucao.dominio,
      linkedinUrl: execucao.linkedin_url,
      erro: execucao.erro,
      solicitadoEm: execucao.solicitado_em,
      concluidoEm: execucao.concluido_em,
      dossie: lerDossie(execucao.resultado),
      fontes: lerFontes(execucao.fontes),
    })),
    totalCalls: calls.count ?? 0,
  };
});
