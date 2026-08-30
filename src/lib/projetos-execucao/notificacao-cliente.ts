import type { EventoProjetoExecucao } from './queries';

export function obterContatoNotificacao(
  eventos: EventoProjetoExecucao[],
  tarefaId: string | undefined,
  emailOriginal: string | null,
) {
  const evento =
    eventos.find((item) => item.tarefaId === tarefaId && item.tipo === 'aprovacao_solicitada') ??
    null;
  return { evento, email: evento?.emailDestinatario ?? emailOriginal };
}
