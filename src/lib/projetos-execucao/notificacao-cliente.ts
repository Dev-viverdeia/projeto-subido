import type { EventoProjetoExecucao } from './queries';

export function obterContatoNotificacao(
  eventos: EventoProjetoExecucao[],
  tarefaId: string | undefined,
  emailOriginal: string | null,
) {
  const evento =
    eventos.find((item) => item.tarefaId === tarefaId && item.tipo === 'aprovacao_solicitada') ??
    null;
  const lembrete =
    eventos.find(
      (item) => item.tipo === 'lembrete_aprovacao' && item.emailOrigemEventoId === evento?.id,
    ) ?? null;
  return { evento, lembrete, email: evento?.emailDestinatario ?? emailOriginal };
}
