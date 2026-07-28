/**
 * Formatação de duração — compartilhada por formações e mentorias.
 * Regra editorial: sem valor real, devolve `null` e o rótulo SOME. Nunca "0min".
 */
export function formatarDuracao(segundos: number | null | undefined): string | null {
  if (!segundos || segundos <= 0) return null;
  const minutos = Math.round(segundos / 60);
  if (minutos < 60) return `${minutos}min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto === 0 ? `${horas}h` : `${horas}h${String(resto).padStart(2, '0')}`;
}

export function somarDuracoes(duracoes: Array<number | null | undefined>): number {
  return duracoes.reduce<number>((soma, d) => soma + (d && d > 0 ? d : 0), 0);
}
