import type { Tables } from '@/lib/supabase/types.generated';

export type StatusEncerramentoProjeto = Tables<'projeto_encerramentos'>['status'];

export type EncerramentoProjeto = {
  id: string;
  status: StatusEncerramentoProjeto;
  resumoEntrega: string;
  resultadoPrincipal: string;
  evidenciaResultadoUrl: string | null;
  garantiaDias: number;
  garantiaCobre: string;
  garantiaNaoCobre: string;
  canalSuporte: string;
  responsavelContinuidade: string;
  orientacaoContinuidade: string;
  enviadoEm: string | null;
  aceitoEm: string | null;
  garantiaTerminaEm: string | null;
};

export function mapearEncerramentoProjeto(
  linha: Tables<'projeto_encerramentos'> | null | undefined,
): EncerramentoProjeto | null {
  if (!linha) return null;
  return {
    id: linha.id,
    status: linha.status,
    resumoEntrega: linha.resumo_entrega,
    resultadoPrincipal: linha.resultado_principal,
    evidenciaResultadoUrl: linha.evidencia_resultado_url,
    garantiaDias: linha.garantia_dias,
    garantiaCobre: linha.garantia_cobre,
    garantiaNaoCobre: linha.garantia_nao_cobre,
    canalSuporte: linha.canal_suporte,
    responsavelContinuidade: linha.responsavel_continuidade,
    orientacaoContinuidade: linha.orientacao_continuidade,
    enviadoEm: linha.enviado_em,
    aceitoEm: linha.aceito_em,
    garantiaTerminaEm: linha.garantia_termina_em,
  };
}

export function obterEncerramentoUnico(
  relacao: Tables<'projeto_encerramentos'>[] | Tables<'projeto_encerramentos'> | null | undefined,
) {
  return mapearEncerramentoProjeto(Array.isArray(relacao) ? relacao[0] : relacao);
}

export function formatarGarantia(encerramento: EncerramentoProjeto): string {
  if (!encerramento.garantiaDias) return 'Sem período adicional de garantia';
  if (!encerramento.garantiaTerminaEm) {
    return `${encerramento.garantiaDias} dias a partir do aceite final`;
  }
  return `Até ${new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
    .format(new Date(encerramento.garantiaTerminaEm))
    .replace('.', '')}`;
}
