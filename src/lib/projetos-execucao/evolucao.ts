import type { Tables } from '@/lib/supabase/types.generated';

export type DecisaoEvolucaoProjeto = NonNullable<Tables<'projeto_evolucoes'>['decisao']>;
export type StatusEvolucaoProjeto = Tables<'projeto_evolucoes'>['status'];

export type EvolucaoProjeto = {
  id: string;
  status: StatusEvolucaoProjeto;
  revisaoEm: string;
  resultadoObservado: string | null;
  evidenciaResultadoUrl: string | null;
  decisao: DecisaoEvolucaoProjeto | null;
  proximoPasso: string | null;
  proximoPassoEm: string | null;
  compartilharCliente: boolean;
  registradaEm: string | null;
};

export const ROTULO_DECISAO_EVOLUCAO: Record<DecisaoEvolucaoProjeto, string> = {
  manter: 'Manter a operação como está',
  ajustar_garantia: 'Corrigir algo dentro da garantia',
  expandir: 'Expandir este projeto',
  novo_projeto: 'Começar outro projeto',
  encerrar: 'Encerrar o acompanhamento',
};

export function mapearEvolucaoProjeto(
  linha: Tables<'projeto_evolucoes'> | null | undefined,
): EvolucaoProjeto | null {
  if (!linha) return null;
  return {
    id: linha.id,
    status: linha.status,
    revisaoEm: linha.revisao_em,
    resultadoObservado: linha.resultado_observado,
    evidenciaResultadoUrl: linha.evidencia_resultado_url,
    decisao: linha.decisao,
    proximoPasso: linha.proximo_passo,
    proximoPassoEm: linha.proximo_passo_em,
    compartilharCliente: linha.compartilhar_cliente,
    registradaEm: linha.registrada_em,
  };
}

export function obterEvolucaoUnica(
  relacao: Tables<'projeto_evolucoes'>[] | Tables<'projeto_evolucoes'> | null | undefined,
) {
  return mapearEvolucaoProjeto(Array.isArray(relacao) ? relacao[0] : relacao);
}

export function formatarDataEvolucao(valor: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  })
    .format(new Date(`${valor}T12:00:00-03:00`))
    .replace('.', '');
}
