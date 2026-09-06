import 'server-only';
import { z } from 'zod';
import { montarEventoGoogle, type DadosEventoCall } from './eventos';
import { GoogleCalendarPrecisaReconectar } from './oauth';

type Opcoes = {
  token: string;
  calendarId: string;
  eventoId: string;
  dados: DadosEventoCall;
  salaUrl: string;
  cancelar: boolean;
  permitirCriacao?: boolean;
};
const EventoSchema = z.object({
  id: z.string().min(5),
  etag: z.string().optional(),
  status: z.string().optional(),
  htmlLink: z.url().optional(),
  start: z.object({ dateTime: z.string().optional() }).optional(),
  end: z.object({ dateTime: z.string().optional() }).optional(),
  extendedProperties: z.object({ private: z.record(z.string(), z.string()).optional() }).optional(),
});

function exigirResposta(resposta: Response) {
  if (resposta.status === 401) throw new GoogleCalendarPrecisaReconectar();
  if (!resposta.ok) throw new Error(`Google Calendar respondeu ${resposta.status}.`);
}

export async function aplicarEventoGoogle(opcoes: Opcoes) {
  const { token, calendarId, eventoId, dados, salaUrl, cancelar } = opcoes;
  const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
  const url = `${base}/${encodeURIComponent(eventoId)}`;
  const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };
  const solicitar = (destino: string, init: RequestInit = {}) =>
    fetch(destino, {
      ...init,
      headers: { ...headers, ...init.headers },
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
  let leitura = await solicitar(url);
  const removido = () => ({ removido: true, eventoId, eventoUrl: null });
  if (leitura.status === 404 && calendarId === 'primary')
    throw new Error('Reconecte a agenda original deste convite.');
  if (cancelar && (leitura.status === 404 || leitura.status === 410)) return removido();
  if (!cancelar && leitura.status === 410) throw new Error('O evento foi removido no Google.');

  if (!cancelar && leitura.status === 404) {
    if (opcoes.permitirCriacao === false) throw new Error('O evento foi removido no Google.');
    const criada = await solicitar(`${base}?sendUpdates=all`, {
      method: 'POST',
      body: JSON.stringify(montarEventoGoogle(dados, salaUrl)),
    });
    if (criada.status !== 409) {
      exigirResposta(criada);
      const evento = EventoSchema.parse(await criada.json());
      return { removido: false, eventoId: evento.id, eventoUrl: evento.htmlLink ?? null };
    }
    // A resposta da primeira criação pode ter se perdido. Nunca gere outro ID.
    leitura = await solicitar(url);
  }
  exigirResposta(leitura);
  const evento = EventoSchema.parse(await leitura.json());
  if (evento.status === 'cancelled') {
    if (cancelar) return removido();
    throw new Error('O evento foi removido no Google. Cancele esta reunião e crie outra.');
  }
  if (evento.extendedProperties?.private?.subido_reuniao_id !== dados.reuniaoId) {
    throw new Error('O vínculo do evento com esta reunião não foi confirmado.');
  }
  const condicionais: Record<string, string> = evento.etag ? { 'if-match': evento.etag } : {};
  if (cancelar) {
    const resposta = await solicitar(`${url}?sendUpdates=all`, {
      method: 'DELETE',
      headers: condicionais,
    });
    if (resposta.status !== 404 && resposta.status !== 410) exigirResposta(resposta);
    return removido();
  }

  const inicio = new Date(dados.agendadaPara).toISOString();
  const fim = new Date(Date.parse(inicio) + dados.duracaoMinutos * 60_000).toISOString();
  if (
    Date.parse(evento.start?.dateTime ?? '') === Date.parse(inicio) &&
    Date.parse(evento.end?.dateTime ?? '') === Date.parse(fim)
  ) {
    return { removido: false, eventoId, eventoUrl: evento.htmlLink ?? null };
  }
  // PATCH só do horário preserva RSVPs, convidados e alterações legítimas feitas no Google.
  const resposta = await solicitar(`${url}?sendUpdates=all`, {
    method: 'PATCH',
    headers: condicionais,
    body: JSON.stringify({ start: { dateTime: inicio }, end: { dateTime: fim } }),
  });
  exigirResposta(resposta);
  const atualizado = EventoSchema.parse(await resposta.json());
  return { removido: false, eventoId: atualizado.id, eventoUrl: atualizado.htmlLink ?? null };
}
