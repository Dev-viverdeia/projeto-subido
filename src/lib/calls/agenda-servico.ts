import 'server-only';
import { z } from 'zod';
import { env } from '@/lib/env';
import type { createClient } from '@/lib/supabase/server';
import type { TablesUpdate } from '@/lib/supabase/types.generated';
import { idEventoGoogle } from '@/lib/google-calendar/eventos';
import { aplicarEventoGoogle } from '@/lib/google-calendar/transporte-evento';
import { decifrarTokenGoogle } from '@/lib/google-calendar/tokens';
import { GoogleCalendarPrecisaReconectar, renovarTokenGoogle } from '@/lib/google-calendar/oauth';
import { podeAlterarHorario, sincronizacaoEmAndamento } from './agenda-modelo';
export type AlteracaoAgenda = {
  reuniaoId: string;
  dono: string;
  acao: 'cancelar' | 'reagendar' | 'sincronizar';
  versao?: string;
  agendadaPara?: string;
  duracaoMinutos?: number;
};
export type ResultadoAgenda = {
  status: 'erro' | 'pendente' | 'concluido';
  mensagem?: string;
  reconectar?: boolean;
};
const CredencialSchema = z.object({
  refresh_token_cifrado: z.string().min(40),
  google_email: z.email(),
  status: z.literal('ativa'),
});

export async function executarAlteracaoAgenda(
  supabase: Awaited<ReturnType<typeof createClient>>,
  alteracao: AlteracaoAgenda,
): Promise<ResultadoAgenda> {
  const { data: reuniao, error } = await supabase
    .from('calls_reunioes')
    .select(
      `
    id,dono,titulo,codigo_publico,status,iniciada_em,agendada_para,duracao_minutos,atualizada_em,
    convidado_email,google_event_id,google_calendar_id,google_sync_status,google_event_url,
    empresa:crm_empresas!calls_reunioes_empresa_fk(nome),
    contato:crm_contatos!calls_reunioes_contato_fk(nome)
  `,
    )
    .eq('id', alteracao.reuniaoId)
    .eq('dono', alteracao.dono)
    .maybeSingle();
  if (error || !reuniao)
    return { status: 'erro', mensagem: 'Não foi possível abrir esta reunião. Atualize a página.' };
  const editando = alteracao.acao !== 'sincronizar';
  if (
    (editando && (!podeAlterarHorario(reuniao.status) || reuniao.iniciada_em)) ||
    (!editando && !podeAlterarHorario(reuniao.status) && reuniao.status !== 'cancelada')
  ) {
    return {
      status: 'erro',
      mensagem: 'Esta reunião já foi iniciada ou encerrada. Atualize a página.',
    };
  }
  if (editando && alteracao.versao !== reuniao.atualizada_em) {
    return {
      status: 'erro',
      mensagem: 'Esta reunião mudou desde que você abriu a tela. Atualize a página.',
    };
  }
  if (sincronizacaoEmAndamento(reuniao.google_sync_status, reuniao.atualizada_em)) {
    return {
      status: 'erro',
      mensagem: 'O Google ainda está sendo atualizado. Aguarde um momento e tente novamente.',
    };
  }
  if (
    alteracao.acao === 'reagendar' &&
    (!alteracao.agendadaPara ||
      !Number.isFinite(Date.parse(alteracao.agendadaPara)) ||
      Date.parse(alteracao.agendadaPara) <= Date.now() ||
      !Number.isInteger(alteracao.duracaoMinutos) ||
      alteracao.duracaoMinutos! < 15 ||
      alteracao.duracaoMinutos! > 240)
  ) {
    return {
      status: 'erro',
      mensagem: 'Escolha um horário futuro e uma duração entre 15 e 240 minutos.',
    };
  }
  const cancelar = alteracao.acao === 'cancelar' || reuniao.status === 'cancelada';
  const temEvento = Boolean(reuniao.google_event_id || reuniao.convidado_email);
  const { data: tokens, error: erroToken } = temEvento
    ? await supabase.rpc('google_calendar_obter_token')
    : { data: null, error: null };
  const credencial = CredencialSchema.safeParse(erroToken ? null : tokens?.[0]);
  const eventoId = reuniao.google_event_id ?? idEventoGoogle(reuniao.id);
  // Grave o calendário concreto antes do primeiro POST. Trocar a conta conectada não pode
  // fazer o retry criar outro evento em uma agenda diferente.
  const calendarId =
    reuniao.google_calendar_id ?? (credencial.success ? credencial.data.google_email : null);
  const valores: TablesUpdate<'calls_reunioes'> = {
    google_sync_status: temEvento ? 'sincronizando' : 'nao_solicitado',
    google_sync_erro: null,
    ...(temEvento ? { google_event_id: eventoId, google_calendar_id: calendarId } : {}),
    ...(alteracao.acao === 'cancelar'
      ? { status: 'cancelada', encerrada_em: new Date().toISOString() }
      : {}),
    ...(alteracao.acao === 'reagendar'
      ? {
          agendada_para: alteracao.agendadaPara,
          duracao_minutos: alteracao.duracaoMinutos,
        }
      : {}),
  };
  // CAS: o timestamp do trigger é a reserva. Só uma tentativa pode reivindicar esta versão.
  const { data: reservada, error: erroReserva } = await supabase
    .from('calls_reunioes')
    .update(valores)
    .eq('id', reuniao.id)
    .eq('dono', alteracao.dono)
    .eq('atualizada_em', reuniao.atualizada_em)
    .select('atualizada_em')
    .maybeSingle();
  if (erroReserva || !reservada)
    return {
      status: 'erro',
      mensagem: 'A reunião foi alterada em outra tentativa. Atualize a página.',
    };
  if (!temEvento) return { status: 'concluido' };

  const finalizar = (campos: TablesUpdate<'calls_reunioes'>) =>
    supabase
      .from('calls_reunioes')
      .update(campos)
      .eq('id', reuniao.id)
      .eq('dono', alteracao.dono)
      .eq('atualizada_em', reservada.atualizada_em)
      .select('id')
      .maybeSingle();
  let reconectar = !credencial.success;
  try {
    if (!credencial.success) throw new GoogleCalendarPrecisaReconectar();
    if (
      calendarId &&
      calendarId !== 'primary' &&
      calendarId.toLowerCase() !== credencial.data.google_email.toLowerCase()
    ) {
      reconectar = true;
      throw new Error('conta_google_diferente');
    }
    if (!cancelar && !reuniao.convidado_email) throw new Error('convidado_ausente');
    const token = await renovarTokenGoogle(
      decifrarTokenGoogle(credencial.data.refresh_token_cifrado),
    );
    const resultado = await aplicarEventoGoogle({
      token: token.access_token,
      calendarId: calendarId ?? credencial.data.google_email,
      eventoId,
      permitirCriacao: !reuniao.google_event_url && calendarId !== 'primary',
      cancelar,
      salaUrl: new URL(`/sala/${reuniao.codigo_publico}`, env.NEXT_PUBLIC_SITE_URL).toString(),
      dados: {
        reuniaoId: reuniao.id,
        codigoPublico: reuniao.codigo_publico,
        titulo: reuniao.titulo,
        empresa: reuniao.empresa?.nome ?? 'Cliente',
        contato: reuniao.contato?.nome ?? null,
        convidadoEmail: reuniao.convidado_email ?? '',
        agendadaPara: alteracao.agendadaPara ?? reuniao.agendada_para,
        duracaoMinutos: alteracao.duracaoMinutos ?? reuniao.duracao_minutos,
      },
    });
    const gravacao = await finalizar({
      google_sync_status: 'sincronizado',
      google_sync_erro: null,
      google_event_url: resultado.eventoUrl,
    });
    if (gravacao.error || !gravacao.data)
      return {
        status: 'pendente',
        mensagem:
          'A alteração foi enviada ao Google, mas falta confirmar o registro. Atualize a página e tente sincronizar.',
      };
    return { status: 'concluido' };
  } catch (causa) {
    const expirou = causa instanceof GoogleCalendarPrecisaReconectar;
    reconectar ||= expirou;
    const mensagem =
      causa instanceof Error && causa.message.includes('agenda original')
        ? 'Reconecte a agenda original deste convite e tente atualizar novamente.'
        : causa instanceof Error && causa.message === 'conta_google_diferente'
          ? `Reconecte a conta ${calendarId} para atualizar este convite.`
          : reconectar
            ? 'Reconecte sua agenda para atualizar o convite. A alteração ficou salva.'
            : causa instanceof Error && causa.message.includes('removido')
              ? 'O evento foi excluído no Google. Cancele esta reunião e crie outra, se necessário.'
              : cancelar
                ? 'A reunião foi cancelada na Subido. Falta remover o convite do Google.'
                : 'O horário ficou salvo na Subido. Falta atualizar o convite no Google.';
    await finalizar({ google_sync_status: 'falhou', google_sync_erro: mensagem });
    if (expirou)
      await supabase.rpc('google_calendar_marcar_estado', {
        p_status: 'reconectar',
        p_erro: mensagem,
      });
    return { status: 'pendente', mensagem, reconectar };
  }
}
