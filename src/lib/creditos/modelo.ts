import type { MovimentoCredito } from './queries';

export type ApresentacaoMovimentoCredito = {
  titulo: string;
  categoria: 'entrada' | 'uso' | 'devolucao';
  rotuloCategoria: string;
  href: string | null;
};

const TITULOS: Record<string, string> = {
  credito_inicial: 'Saldo inicial',
  assinatura: 'Créditos da assinatura',
  pacote: 'Pacote de créditos',
  compra: 'Pacote de créditos',
  ajuste: 'Ajuste de saldo',
  busca: 'Lista de prospecção',
  estorno: 'Créditos devolvidos',
  enriquecimento: 'Enriquecimento de oportunidade',
  estorno_enriquecimento: 'Créditos devolvidos',
  mentoria: 'Check-in em mentoria',
  estorno_mentoria: 'Cancelamento de check-in',
};

const TIPOS_DEVOLUCAO = new Set(['estorno', 'estorno_enriquecimento', 'estorno_mentoria']);

export function apresentarMovimentoCredito(
  movimento: MovimentoCredito,
): ApresentacaoMovimentoCredito {
  const categoria = TIPOS_DEVOLUCAO.has(movimento.tipo)
    ? 'devolucao'
    : movimento.movimento < 0
      ? 'uso'
      : 'entrada';

  const href = movimento.lista_id
    ? `/prospeccao?lista=${movimento.lista_id}`
    : movimento.mentoria_id
      ? '/mentorias'
      : movimento.enriquecimento_id
        ? '/vendas'
        : null;

  return {
    titulo:
      TITULOS[movimento.tipo] ??
      (movimento.movimento < 0 ? 'Créditos usados' : 'Créditos recebidos'),
    categoria,
    rotuloCategoria:
      categoria === 'devolucao' ? 'Devolução' : categoria === 'uso' ? 'Uso' : 'Entrada',
    href,
  };
}

export function formatarMovimentoCredito(valor: number): string {
  const sinal = valor > 0 ? '+' : '−';
  return `${sinal}${Math.abs(valor)}`;
}
