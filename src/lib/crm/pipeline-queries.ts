import 'server-only';

import { cache } from 'react';
import { handleError } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/supabase/types.generated';
import type { StatusEnriquecimento } from './enriquecimento';
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
  ganhaEm: string | null;
  perdidaEm: string | null;
  motivoPerda: string | null;
  ultimoFato: string | null;
  ultimoFatoEm: string | null;
  atualizadoEm: string;
  criadoEm: string;
};

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

export const obterFocoLeveDoCrm = cache(async (): Promise<OportunidadeSeletor | null> => {
  const oportunidades = await listarOportunidadesSeletor();
  return (
    oportunidades.find((item) => item.etapa !== 'ganho' && item.etapa !== 'perdido') ??
    oportunidades.find((item) => item.etapa === 'ganho') ??
    null
  );
});

export const listarPipeline = cache(async (): Promise<OportunidadeCrm[]> => {
  const supabase = await createClient();
  const [oportunidades, eventos, enriquecimentos] = await Promise.all([
    supabase
      .from('crm_oportunidades')
      .select(
        `
          id, titulo, etapa, empresa_id, contato_principal_id, valor_centavos,
          proxima_acao, proxima_acao_em, ganha_em, perdida_em, motivo_perda,
          atualizado_em, criado_em, ordem,
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

  const ultimoFato = new Map<string, { titulo: string; ocorrido_em: string }>();
  const statusEnriquecimento = new Map<string, StatusEnriquecimento>();

  for (const evento of eventos.data ?? []) {
    if (!ultimoFato.has(evento.oportunidade_id)) ultimoFato.set(evento.oportunidade_id, evento);
  }
  for (const enriquecimento of enriquecimentos.data ?? []) {
    if (!statusEnriquecimento.has(enriquecimento.oportunidade_id)) {
      statusEnriquecimento.set(enriquecimento.oportunidade_id, enriquecimento.status);
    }
  }

  return (oportunidades.data ?? []).map((linha) =>
    montarOportunidade(linha, ultimoFato, statusEnriquecimento),
  );
});

export function montarOportunidade(
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
