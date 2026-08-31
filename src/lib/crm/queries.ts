import 'server-only';

import { cache } from 'react';
import { oportunidadeTemDescobertaConcluida } from '@/lib/calls/descoberta';
import { handleError } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';
import { obterContinuidadePosEntrega } from './continuidade-pos-entrega';
import { lerDossie, lerFontes, type StatusEnriquecimento } from './enriquecimento';
import type { DossieLead, ProjetoDossie } from './dossie-types';
import { montarOportunidade } from './pipeline-queries';
import { projetoSugeridoDaProspeccao } from './projeto-sugerido';

export type {
  AcaoPlanoDossie,
  CallDossieLead,
  ContinuidadePosEntregaDossie,
  DossieLead,
  EventoDossie,
  ExecucaoEnriquecimento,
  ProjetoAtivoDossie,
  ProjetoDossie,
  PropostaDossie,
} from './dossie-types';
export {
  listarOportunidadesSeletor,
  listarPipeline,
  obterFocoLeveDoCrm,
  type OportunidadeCrm,
  type OportunidadeSeletor,
} from './pipeline-queries';

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
    descobertaConcluida,
    acoesPlano,
    projetosRecentes,
    propostaRecente,
    carteira,
    continuidadePosEntrega,
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
    oportunidadeTemDescobertaConcluida(id),
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
    obterContinuidadePosEntrega(id),
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
    temDescobertaConcluida: descobertaConcluida,
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
    continuidadePosEntrega,
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
