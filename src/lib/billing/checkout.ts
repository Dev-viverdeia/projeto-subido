export type EstadoCheckout =
  | 'confirmado'
  | 'atualizando'
  | 'pendente'
  | 'expirado'
  | 'falhou'
  | 'reembolsado'
  | 'indisponivel'
  | 'nao_encontrado';

export function sessaoCheckoutValida(valor: unknown): valor is string {
  return typeof valor === 'string' && /^cs_[A-Za-z0-9_]{5,240}$/.test(valor);
}
