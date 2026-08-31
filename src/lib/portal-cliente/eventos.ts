export const EVENTOS_VISIVEIS_PORTAL = [
  'aprovacao_solicitada',
  'entrega_aprovada',
  'ajustes_solicitados',
  'arquivo_liberado',
  'pendencia_concluida',
  'mudanca_escopo_solicitada',
  'mudanca_escopo_incluida',
  'mudanca_escopo_proposta',
  'mudanca_escopo_aprovada',
  'mudanca_escopo_recusada',
] as const;

export function descreverProximaAcaoPortal(
  concluido: boolean,
  totalAcoes: number,
  mudancasAguardando: number,
) {
  if (concluido) {
    return 'O aceite final foi registrado. Os materiais continuam disponíveis neste portal.';
  }
  if (!totalAcoes) {
    return 'Você não precisa fazer nada agora. Avisaremos quando uma validação estiver pronta.';
  }
  return mudancasAguardando
    ? 'Confira o impacto da mudança antes de manter o combinado ou aprovar.'
    : 'Resolva as pendências de preparação ou revise o que já foi entregue.';
}
