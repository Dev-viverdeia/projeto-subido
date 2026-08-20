export const CAMPO_INTRODUCAO_SUBIDO = 'introducao_subido_concluida_em';

export function concluiuIntroducaoSubido(metadata: unknown): boolean {
  if (!metadata || typeof metadata !== 'object') return false;
  const valor = (metadata as Record<string, unknown>)[CAMPO_INTRODUCAO_SUBIDO];
  return typeof valor === 'string' && valor.trim().length > 0;
}
