import 'server-only';

import { z } from 'zod';
import { env } from '@/lib/env';
import type { createClient } from '@/lib/supabase/server';
import { decifrarTokenGoogle } from './tokens';
import { GoogleCalendarPrecisaReconectar, renovarTokenGoogle } from './oauth';

type ClienteSupabase = Awaited<ReturnType<typeof createClient>>;

const CredencialSchema = z.object({
  refresh_token_cifrado: z.string().min(40),
  calendar_id: z.string().min(1),
  google_email: z.email(),
  status: z.enum(['ativa', 'reconectar', 'erro']),
});

const EventoGoogleSchema = z.object({
  id: z.string().min(5),
  htmlLink: z.url().optional(),
});

export type DadosEventoCall = {
  reuniaoId: string;
  codigoPublico: string;
  titulo: string;
  empresa: string;
  contato: string | null;
  convidadoEmail: string;
  agendadaPara: string;
  duracaoMinutos: number;
};

export type ResultadoSincronizacaoGoogle =
  | { status: 'sincronizado'; eventoUrl: string | null }
  | { status: 'falhou'; mensagem: string }
  | { status: 'sem_conexao'; mensagem: string };

export function idEventoGoogle(reuniaoId: string) {
  return `subido${reuniaoId.replaceAll('-', '').toLowerCase()}`;
}

function descricaoEvento(dados: DadosEventoCall, salaUrl: string) {
  const linhas = [
    `Reunião com ${dados.empresa}.`,
    dados.contato ? `Contato: ${dados.contato}.` : null,
    '',
    'Acesse a sala da Subido:',
    salaUrl,
    '',
    'A sala reúne a conversa, a transcrição e os próximos passos desta venda.',
  ];
  return linhas.filter((linha): linha is string => linha !== null).join('\n');
}

export function montarEventoGoogle(dados: DadosEventoCall, salaUrl: string) {
  const inicio = new Date(dados.agendadaPara);
  const fim = new Date(inicio.getTime() + dados.duracaoMinutos * 60_000);
  return {
    id: idEventoGoogle(dados.reuniaoId),
    summary: dados.titulo,
    description: descricaoEvento(dados, salaUrl),
    location: salaUrl,
    start: { dateTime: inicio.toISOString() },
    end: { dateTime: fim.toISOString() },
    attendees: [{ email: dados.convidadoEmail }],
    source: { title: 'Abrir sala na Subido', url: salaUrl },
    extendedProperties: { private: { subido_reuniao_id: dados.reuniaoId } },
    reminders: { useDefault: true },
  };
}

async function marcarConexao(
  supabase: ClienteSupabase,
  status: 'ativa' | 'reconectar' | 'erro',
  erro?: string,
) {
  await supabase.rpc('google_calendar_marcar_estado', {
    p_status: status,
    p_erro: erro,
  });
}

async function marcarCall(
  supabase: ClienteSupabase,
  reuniaoId: string,
  valores: {
    google_sync_status: 'nao_solicitado' | 'sincronizando' | 'sincronizado' | 'falhou';
    convidado_email?: string;
    google_event_id?: string | null;
    google_event_url?: string | null;
    google_calendar_id?: string | null;
    google_sync_erro?: string | null;
  },
) {
  const { error } = await supabase.from('calls_reunioes').update(valores).eq('id', reuniaoId);
  if (error) console.error(`[google-calendar:call] ${error.code}: ${error.message}`);
}

export async function removerCallDoGoogle(
  supabase: ClienteSupabase,
  dados: { reuniaoId: string; eventoId: string | null; calendarId: string | null },
) {
  if (!dados.eventoId || !dados.calendarId) return { status: 'sem_evento' } as const;

  const { data, error } = await supabase.rpc('google_calendar_obter_token');
  const leitura = CredencialSchema.safeParse(data?.[0]);
  if (error || !leitura.success || leitura.data.status !== 'ativa') {
    return { status: 'falhou' } as const;
  }

  try {
    const refreshToken = decifrarTokenGoogle(leitura.data.refresh_token_cifrado);
    const tokens = await renovarTokenGoogle(refreshToken);
    const calendarId = encodeURIComponent(dados.calendarId);
    const eventoId = encodeURIComponent(dados.eventoId);
    const resposta = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventoId}?sendUpdates=all`,
      {
        method: 'DELETE',
        headers: { authorization: `Bearer ${tokens.access_token}` },
        cache: 'no-store',
      },
    );

    if (!resposta.ok && resposta.status !== 404 && resposta.status !== 410) {
      throw new Error(`Google Calendar respondeu ${resposta.status}.`);
    }

    await marcarCall(supabase, dados.reuniaoId, {
      google_sync_status: 'nao_solicitado',
      google_event_id: null,
      google_event_url: null,
      google_calendar_id: null,
      google_sync_erro: null,
    });
    return { status: 'removido' } as const;
  } catch (erro) {
    console.error('[google-calendar:remover-evento]', erro);
    return { status: 'falhou' } as const;
  }
}

export async function sincronizarCallNoGoogle(
  supabase: ClienteSupabase,
  dados: DadosEventoCall,
): Promise<ResultadoSincronizacaoGoogle> {
  await marcarCall(supabase, dados.reuniaoId, {
    google_sync_status: 'sincronizando',
    convidado_email: dados.convidadoEmail,
    google_sync_erro: null,
  });

  const { data, error } = await supabase.rpc('google_calendar_obter_token');
  const leitura = CredencialSchema.safeParse(data?.[0]);
  if (error || !leitura.success || leitura.data.status !== 'ativa') {
    const mensagem = 'Conecte novamente o Google Calendar para enviar o convite.';
    await marcarCall(supabase, dados.reuniaoId, {
      google_sync_status: 'falhou',
      google_sync_erro: mensagem,
    });
    return { status: 'sem_conexao', mensagem };
  }

  const credencial = leitura.data;
  const salaUrl = new URL(`/sala/${dados.codigoPublico}`, env.NEXT_PUBLIC_SITE_URL).toString();
  const eventoId = idEventoGoogle(dados.reuniaoId);

  try {
    const refreshToken = decifrarTokenGoogle(credencial.refresh_token_cifrado);
    const tokens = await renovarTokenGoogle(refreshToken);
    const calendarId = encodeURIComponent(credencial.calendar_id);
    const corpo = montarEventoGoogle(dados, salaUrl);

    const inserir = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?sendUpdates=all`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${tokens.access_token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(corpo),
        cache: 'no-store',
      },
    );

    let resposta: Response = inserir;
    if (inserir.status === 409) {
      resposta = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventoId}`,
        { headers: { authorization: `Bearer ${tokens.access_token}` }, cache: 'no-store' },
      );
    }
    if (!resposta.ok) throw new Error(`Google Calendar respondeu ${resposta.status}.`);

    const evento = EventoGoogleSchema.parse(await resposta.json());
    const eventoUrl = evento.htmlLink ?? null;
    await marcarCall(supabase, dados.reuniaoId, {
      google_sync_status: 'sincronizado',
      google_event_id: evento.id,
      google_event_url: eventoUrl,
      google_calendar_id: credencial.calendar_id,
      google_sync_erro: null,
    });
    await marcarConexao(supabase, 'ativa');
    return { status: 'sincronizado', eventoUrl };
  } catch (erro) {
    const reconectar = erro instanceof GoogleCalendarPrecisaReconectar;
    const mensagem = reconectar
      ? 'A conexão com o Google expirou. Reconecte o calendário e tente novamente.'
      : 'A reunião foi criada, mas o Google não enviou o convite. Tente sincronizar novamente.';
    await Promise.all([
      marcarCall(supabase, dados.reuniaoId, {
        google_sync_status: 'falhou',
        google_event_id: eventoId,
        google_calendar_id: credencial.calendar_id,
        google_sync_erro: mensagem,
      }),
      marcarConexao(supabase, reconectar ? 'reconectar' : 'ativa', mensagem),
    ]);
    console.error('[google-calendar:evento]', erro);
    return { status: 'falhou', mensagem };
  }
}
