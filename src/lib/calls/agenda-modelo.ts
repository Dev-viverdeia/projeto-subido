/** Valida o calendário civil antes de aplicar o deslocamento informado pelo navegador. */
export function dataLocalParaUtc(local: string, offset: number): Date | null {
  if (!Number.isInteger(offset) || Math.abs(offset) > 840) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return null;
  const data = new Date(`${local}:00.000Z`);
  if (!Number.isFinite(data.getTime()) || data.toISOString().slice(0, 16) !== local) return null;
  return new Date(data.getTime() + offset * 60_000);
}

export function podeAlterarHorario(status: string) {
  return status === 'agendada' || status === 'aguardando';
}

/** O transporte tem timeout de 15 s por chamada; uma reserva órfã pode ser retomada após 2 min. */
export function sincronizacaoEmAndamento(status: string, atualizadaEm: string, agora = new Date()) {
  return status === 'sincronizando' && agora.getTime() - Date.parse(atualizadaEm) < 120_000;
}
