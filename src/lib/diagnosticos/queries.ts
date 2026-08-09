import 'server-only';

import { cache } from 'react';
import { listarOportunidadesSeletor, type OportunidadeSeletor } from '@/lib/crm/queries';
import { handleError } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';
import type { Enums } from '@/lib/supabase/types.generated';
import {
  lerFontesDiagnostico,
  lerRelatorioDiagnostico,
  type CanalDiagnostico,
  type FonteDiagnostico,
  type RelatorioDiagnostico,
} from './schema';

export type StatusDiagnostico = Enums<'diagnostico_atendimento_status'>;

export type ResumoDiagnostico = {
  id: string;
  status: StatusDiagnostico;
  canal: CanalDiagnostico;
  notaGeral: number | null;
  solicitadoEm: string;
  concluidoEm: string | null;
  empresa: string;
  oportunidade: string;
};

export type DiagnosticoCompleto = ResumoDiagnostico & {
  empresaId: string;
  oportunidadeId: string;
  contato: string | null;
  siteUrl: string | null;
  cenario: string;
  temEvidenciaInformada: boolean;
  relatorio: RelatorioDiagnostico | null;
  fontes: FonteDiagnostico[];
  erro: string | null;
  iniciadoEm: string | null;
  atualizadoEm: string;
  proximaAcaoAtual: string | null;
};

export async function listarOpcoesDiagnostico(): Promise<OportunidadeSeletor[]> {
  const pipeline = await listarOportunidadesSeletor();
  return pipeline.filter((item) => item.etapa !== 'ganho' && item.etapa !== 'perdido');
}

export const listarDiagnosticos = cache(async (): Promise<ResumoDiagnostico[]> => {
  const supabase = await createClient();
  const [diagnosticos, empresas, oportunidades] = await Promise.all([
    supabase
      .from('diagnosticos_atendimento')
      .select(
        'id, status, canal, nota_geral, solicitado_em, concluido_em, empresa_id, oportunidade_id',
      )
      .order('solicitado_em', { ascending: false })
      .limit(100),
    supabase.from('crm_empresas').select('id, nome').limit(500),
    supabase.from('crm_oportunidades').select('id, titulo').limit(500),
  ]);
  if (diagnosticos.error) throw handleError(diagnosticos.error, 'diagnosticos:listar');
  if (empresas.error) throw handleError(empresas.error, 'diagnosticos:listar-empresas');
  if (oportunidades.error) {
    throw handleError(oportunidades.error, 'diagnosticos:listar-oportunidades');
  }
  if (!diagnosticos.data?.length) return [];

  const empresaPorId = new Map((empresas.data ?? []).map((item) => [item.id, item.nome]));
  const oportunidadePorId = new Map(
    (oportunidades.data ?? []).map((item) => [item.id, item.titulo]),
  );

  return diagnosticos.data.map((item) => ({
    id: item.id,
    status: item.status,
    canal: item.canal,
    notaGeral: item.nota_geral,
    solicitadoEm: item.solicitado_em,
    concluidoEm: item.concluido_em,
    empresa: empresaPorId.get(item.empresa_id) ?? 'Empresa não encontrada',
    oportunidade: oportunidadePorId.get(item.oportunidade_id) ?? 'Oportunidade não encontrada',
  }));
});

export const obterDiagnostico = cache(async (id: string): Promise<DiagnosticoCompleto | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('diagnosticos_atendimento')
    .select(
      'id, status, canal, nota_geral, solicitado_em, iniciado_em, concluido_em, atualizado_em, empresa_id, contato_id, oportunidade_id, site_url, cenario, evidencia_informada, resultado, fontes, erro',
    )
    .eq('id', id)
    .maybeSingle();
  if (error) throw handleError(error, 'diagnosticos:obter');
  if (!data) return null;

  const [empresa, contato, oportunidade] = await Promise.all([
    supabase.from('crm_empresas').select('nome').eq('id', data.empresa_id).maybeSingle(),
    data.contato_id
      ? supabase.from('crm_contatos').select('nome').eq('id', data.contato_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from('crm_oportunidades')
      .select('titulo, proxima_acao')
      .eq('id', data.oportunidade_id)
      .maybeSingle(),
  ]);
  if (empresa.error) throw handleError(empresa.error, 'diagnosticos:empresa');
  if (contato.error) throw handleError(contato.error, 'diagnosticos:contato');
  if (oportunidade.error) throw handleError(oportunidade.error, 'diagnosticos:oportunidade');
  if (!empresa.data || !oportunidade.data) return null;

  return {
    id: data.id,
    status: data.status,
    canal: data.canal,
    notaGeral: data.nota_geral,
    solicitadoEm: data.solicitado_em,
    iniciadoEm: data.iniciado_em,
    concluidoEm: data.concluido_em,
    atualizadoEm: data.atualizado_em,
    empresaId: data.empresa_id,
    oportunidadeId: data.oportunidade_id,
    empresa: empresa.data.nome,
    contato: contato.data?.nome ?? null,
    oportunidade: oportunidade.data.titulo,
    proximaAcaoAtual: oportunidade.data.proxima_acao,
    siteUrl: data.site_url,
    cenario: data.cenario,
    temEvidenciaInformada: Boolean(data.evidencia_informada),
    relatorio: lerRelatorioDiagnostico(data.resultado),
    fontes: lerFontesDiagnostico(data.fontes),
    erro: data.erro,
  };
});
