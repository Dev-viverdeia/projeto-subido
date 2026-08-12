import { etapaAberta } from '@/lib/crm/etapas';
import type { OportunidadeSeletor } from '@/lib/crm/queries';
import type { StatusProjetoExecucao } from '@/lib/projetos-execucao/status';
import type { StatusProposta } from '@/lib/propostas/queries';

export type PropostaNaRotaProjeto = {
  id: string;
  status: StatusProposta;
  atualizadoEm: string;
};

export type ExecucaoNaRotaProjeto = {
  id: string;
  status: StatusProjetoExecucao;
  atualizadoEm: string;
};

export type OportunidadeNaRotaProjeto = Pick<
  OportunidadeSeletor,
  'id' | 'titulo' | 'empresa' | 'contato' | 'etapa'
> & {
  proposta: PropostaNaRotaProjeto | null;
  execucao: ExecucaoNaRotaProjeto | null;
};

export type ContextoRotaComercialProjeto = {
  oportunidades: OportunidadeNaRotaProjeto[];
  oportunidadeInicialId: string | null;
};

export type LinhaPropostaRotaProjeto = {
  id: string;
  oportunidade_id: string;
  status: StatusProposta;
  atualizado_em: string;
};

export type LinhaExecucaoRotaProjeto = {
  id: string;
  oportunidade_id: string;
  status: StatusProjetoExecucao;
  atualizado_em: string;
};

function prioridade(item: OportunidadeNaRotaProjeto): number {
  if (item.execucao && item.execucao.status !== 'concluido') return 0;
  if (item.proposta && item.proposta.status !== 'recusada') return 1;
  if (etapaAberta(item.etapa)) return 2;
  if (item.execucao) return 3;
  return 4;
}

/** Une CRM, proposta e entrega sem inventar uma entidade intermediária. */
export function montarRotaComercialProjeto(
  oportunidades: OportunidadeSeletor[],
  propostas: LinhaPropostaRotaProjeto[],
  execucoes: LinhaExecucaoRotaProjeto[],
): ContextoRotaComercialProjeto {
  const propostaPorOportunidade = new Map<string, PropostaNaRotaProjeto>();
  const execucaoPorOportunidade = new Map<string, ExecucaoNaRotaProjeto>();

  for (const proposta of propostas) {
    if (propostaPorOportunidade.has(proposta.oportunidade_id)) continue;
    propostaPorOportunidade.set(proposta.oportunidade_id, {
      id: proposta.id,
      status: proposta.status,
      atualizadoEm: proposta.atualizado_em,
    });
  }

  for (const execucao of execucoes) {
    if (execucaoPorOportunidade.has(execucao.oportunidade_id)) continue;
    execucaoPorOportunidade.set(execucao.oportunidade_id, {
      id: execucao.id,
      status: execucao.status,
      atualizadoEm: execucao.atualizado_em,
    });
  }

  const relevantes = oportunidades
    .flatMap((oportunidade) => {
      const proposta = propostaPorOportunidade.get(oportunidade.id) ?? null;
      const execucao = execucaoPorOportunidade.get(oportunidade.id) ?? null;
      if (!etapaAberta(oportunidade.etapa) && !proposta && !execucao) return [];
      return [{ ...oportunidade, proposta, execucao }];
    })
    .sort((a, b) => {
      const diferenca = prioridade(a) - prioridade(b);
      if (diferenca !== 0) return diferenca;
      const dataA = a.execucao?.atualizadoEm ?? a.proposta?.atualizadoEm ?? '';
      const dataB = b.execucao?.atualizadoEm ?? b.proposta?.atualizadoEm ?? '';
      return dataB.localeCompare(dataA);
    });

  return {
    oportunidades: relevantes,
    oportunidadeInicialId: relevantes[0]?.id ?? null,
  };
}
