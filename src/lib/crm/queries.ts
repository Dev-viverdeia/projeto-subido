import 'server-only';

import { cache } from 'react';
import { handleError } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/supabase/types.generated';
import type { StatusCall, TipoCall } from '@/lib/calls/tipos';
import {
  lerDossie,
  lerFontes,
  type DossieEnriquecido,
  type FonteEnriquecimento,
  type StatusEnriquecimento,
} from './enriquecimento';
import type { EtapaCrm } from './etapas';

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
  ultimoFato: string | null;
  ultimoFatoEm: string | null;
  atualizadoEm: string;
  criadoEm: string;
};

/**
 * Recorte leve para seletores que só precisam identificar a oportunidade.
 *
 * Calls, diagnósticos e propostas não precisam carregar eventos e análises de
 * enriquecimento para abrir um formulário. Manter essa leitura separada evita
 * duas consultas e reduz o tempo até a primeira interação nessas rotas.
 */
export type OportunidadeSeletor = Pick<
  OportunidadeCrm,
  'id' | 'titulo' | 'etapa' | 'empresa' | 'dominio' | 'contato'
>;

export const listarOportunidadesSeletor = cache(async (): Promise<OportunidadeSeletor[]> => {
  const supabase = await createClient();
  const [oportunidades, empresas, contatos] = await Promise.all([
    supabase
      .from('crm_oportunidades')
      .select('id, titulo, etapa, empresa_id, contato_principal_id, ordem')
      .order('ordem', { ascending: false })
      .limit(300),
    supabase.from('crm_empresas').select('id, nome, dominio').limit(500),
    supabase.from('crm_contatos').select('id, nome').limit(800),
  ]);

  if (oportunidades.error) {
    throw handleError(oportunidades.error, 'crm:seletor-oportunidades');
  }
  if (empresas.error) throw handleError(empresas.error, 'crm:seletor-empresas');
  if (contatos.error) throw handleError(contatos.error, 'crm:seletor-contatos');

  const empresaPorId = new Map((empresas.data ?? []).map((empresa) => [empresa.id, empresa]));
  const contatoPorId = new Map((contatos.data ?? []).map((contato) => [contato.id, contato.nome]));

  return (oportunidades.data ?? []).map((oportunidade) => ({
    id: oportunidade.id,
    titulo: oportunidade.titulo,
    etapa: oportunidade.etapa,
    empresa: empresaPorId.get(oportunidade.empresa_id)?.nome ?? 'Empresa não encontrada',
    dominio: empresaPorId.get(oportunidade.empresa_id)?.dominio ?? null,
    contato: oportunidade.contato_principal_id
      ? (contatoPorId.get(oportunidade.contato_principal_id) ?? null)
      : null,
  }));
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

  const [oportunidades, empresas, contatos, eventos, enriquecimentos] = await Promise.all([
    supabase
      .from('crm_oportunidades')
      .select(
        'id, titulo, etapa, empresa_id, contato_principal_id, valor_centavos, proxima_acao, proxima_acao_em, atualizado_em, criado_em, ordem',
      )
      .order('ordem', { ascending: false })
      .limit(300),
    supabase.from('crm_empresas').select('id, nome, dominio, enriquecido_em').limit(500),
    supabase.from('crm_contatos').select('id, nome, email').limit(800),
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
  if (empresas.error) throw handleError(empresas.error, 'crm:empresas');
  if (contatos.error) throw handleError(contatos.error, 'crm:contatos');
  if (eventos.error) throw handleError(eventos.error, 'crm:eventos');
  if (enriquecimentos.error) {
    throw handleError(enriquecimentos.error, 'crm:enriquecimentos');
  }

  const empresaPorId = new Map((empresas.data ?? []).map((empresa) => [empresa.id, empresa]));
  const contatoPorId = new Map((contatos.data ?? []).map((contato) => [contato.id, contato]));
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
    montarOportunidade(
      linha,
      empresaPorId,
      contatoPorId,
      ultimoFatoPorOportunidade,
      enriquecimentoPorOportunidade,
    ),
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
    | 'atualizado_em'
    | 'criado_em'
  >,
  empresas: Map<
    string,
    { id: string; nome: string; dominio: string | null; enriquecido_em: string | null }
  >,
  contatos: Map<string, { id: string; nome: string; email: string | null }>,
  eventos: Map<string, { titulo: string; ocorrido_em: string }>,
  enriquecimentos: Map<string, StatusEnriquecimento>,
): OportunidadeCrm {
  const contato = linha.contato_principal_id ? contatos.get(linha.contato_principal_id) : undefined;
  const evento = eventos.get(linha.id);
  const empresa = empresas.get(linha.empresa_id);

  return {
    id: linha.id,
    titulo: linha.titulo,
    etapa: linha.etapa,
    empresaId: linha.empresa_id,
    empresa: empresa?.nome ?? 'Empresa não encontrada',
    dominio: empresa?.dominio ?? null,
    enriquecidoEm: empresa?.enriquecido_em ?? null,
    enriquecimentoStatus: enriquecimentos.get(linha.id) ?? null,
    contatoId: linha.contato_principal_id,
    contato: contato?.nome ?? null,
    contatoEmail: contato?.email ?? null,
    valorCentavos: linha.valor_centavos,
    proximaAcao: linha.proxima_acao,
    proximaAcaoEm: linha.proxima_acao_em,
    ultimoFato: evento?.titulo ?? null,
    ultimoFatoEm: evento?.ocorrido_em ?? null,
    atualizadoEm: linha.atualizado_em,
    criadoEm: linha.criado_em,
  };
}

/** Oportunidade aberta mais recentemente mexida — contexto real para o início. */
export const obterFocoDoCrm = cache(async (): Promise<OportunidadeCrm | null> => {
  const pipeline = await listarPipeline();
  return pipeline.find((item) => item.etapa !== 'ganho' && item.etapa !== 'perdido') ?? null;
});

export type EventoDossie = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  ocorridoEm: string;
  fonte: string;
};

export type ExecucaoEnriquecimento = {
  id: string;
  status: StatusEnriquecimento;
  dominio: string | null;
  linkedinUrl: string | null;
  erro: string | null;
  solicitadoEm: string;
  concluidoEm: string | null;
  dossie: DossieEnriquecido | null;
  fontes: FonteEnriquecimento[];
};

export type CallDossieLead = {
  id: string;
  titulo: string;
  tipo: TipoCall;
  status: StatusCall;
  agendadaPara: string;
  iniciadaEm: string | null;
  encerradaEm: string | null;
  duracaoMinutos: number;
  codigoPublico: string;
};

export type AcaoPlanoDossie = {
  id: string;
  titulo: string;
  prazoEm: string | null;
  reuniaoId: string | null;
};

export type ProjetoAtivoDossie = {
  id: string;
  titulo: string;
  status: Tables<'projetos_execucao'>['status'];
};

export type DossieLead = {
  oportunidade: OportunidadeCrm;
  empresa: {
    nome: string;
    dominio: string | null;
    setor: string | null;
    porte: string | null;
    cidade: string | null;
    estado: string | null;
  };
  contato: {
    nome: string;
    email: string | null;
    telefone: string | null;
    cargo: string | null;
    linkedinUrl: string | null;
  } | null;
  eventos: EventoDossie[];
  calls: CallDossieLead[];
  acoesPlano: AcaoPlanoDossie[];
  projetoAtivo: ProjetoAtivoDossie | null;
  enriquecimentos: ExecucaoEnriquecimento[];
  totalCalls: number;
};

/**
 * Dossiê de uma oportunidade. Todas as leituras seguem a sessão e a RLS; um UUID
 * de outra conta é indistinguível de um UUID inexistente.
 */
export const obterDossieLead = cache(async (id: string): Promise<DossieLead | null> => {
  const supabase = await createClient();
  const { data: linha, error } = await supabase
    .from('crm_oportunidades')
    .select(
      'id, titulo, etapa, empresa_id, contato_principal_id, valor_centavos, proxima_acao, proxima_acao_em, atualizado_em, criado_em',
    )
    .eq('id', id)
    .maybeSingle();

  if (error) throw handleError(error, 'crm:dossie-oportunidade');
  if (!linha) return null;

  const [empresa, contato, eventos, enriquecimentos, calls, acoesPlano, projetoAtivo] =
    await Promise.all([
      supabase
        .from('crm_empresas')
        .select('id, nome, dominio, setor, porte, cidade, estado, enriquecido_em')
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
        .select('id, titulo, status')
        .eq('oportunidade_id', id)
        .neq('status', 'concluido')
        .order('atualizado_em', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  if (empresa.error) throw handleError(empresa.error, 'crm:dossie-empresa');
  if (contato.error) throw handleError(contato.error, 'crm:dossie-contato');
  if (eventos.error) throw handleError(eventos.error, 'crm:dossie-eventos');
  if (enriquecimentos.error) {
    throw handleError(enriquecimentos.error, 'crm:dossie-enriquecimentos');
  }
  if (calls.error) throw handleError(calls.error, 'crm:dossie-calls');
  if (acoesPlano.error) throw handleError(acoesPlano.error, 'crm:dossie-plano');
  if (projetoAtivo.error) throw handleError(projetoAtivo.error, 'crm:dossie-projeto');

  const empresaLinha = empresa.data;
  if (!empresaLinha) return null;

  const ultimaExecucao = enriquecimentos.data?.[0];
  const empresaPorId = new Map([[empresaLinha.id, empresaLinha]]);
  const contatoPorId = new Map(contato.data ? [[contato.data.id, { ...contato.data }]] : []);
  const ultimoEvento = eventos.data?.[0];
  const eventoPorOportunidade = new Map(
    ultimoEvento
      ? [[id, { titulo: ultimoEvento.titulo, ocorrido_em: ultimoEvento.ocorrido_em }]]
      : [],
  );
  const statusPorOportunidade = new Map<string, StatusEnriquecimento>(
    ultimaExecucao ? [[id, ultimaExecucao.status]] : [],
  );

  return {
    oportunidade: montarOportunidade(
      linha,
      empresaPorId,
      contatoPorId,
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
    projetoAtivo: projetoAtivo.data
      ? {
          id: projetoAtivo.data.id,
          titulo: projetoAtivo.data.titulo,
          status: projetoAtivo.data.status,
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
