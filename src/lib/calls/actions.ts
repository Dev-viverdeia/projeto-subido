'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { revalidarDirecaoOperacional } from '@/lib/consultor/revalidacao';
import { ETAPAS_CRM, type EtapaCrm } from '@/lib/crm/etapas';
import { removerCallDoGoogle, sincronizarCallNoGoogle } from '@/lib/google-calendar/eventos';
import { callPassouDaJanela, TIPOS_CALL } from './tipos';

const tipos = TIPOS_CALL.map((tipo) => tipo.id) as [string, ...string[]];

const agendarSchema = z
  .object({
    oportunidade: z.uuid('Escolha um cliente em Vendas.'),
    tipo: z.enum(tipos),
    titulo: z.string().trim().max(180, 'Título muito longo.'),
    agendadaPara: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Escolha data e horário.'),
    duracao: z.coerce.number().int().min(15).max(240),
    offsetMinutos: z.coerce.number().int().min(-840).max(840),
    liveCoach: z.boolean(),
    enviarConviteGoogle: z.boolean(),
    convidadoEmail: z.union([z.literal(''), z.email('Informe um e-mail válido para o convite.')]),
  })
  .superRefine((dados, contexto) => {
    if (dados.enviarConviteGoogle && !dados.convidadoEmail) {
      contexto.addIssue({
        code: 'custom',
        path: ['convidadoEmail'],
        message: 'Informe o e-mail do cliente para enviar o convite.',
      });
    }
  });

const proximaAcaoSchema = z.object({
  reuniao: z.uuid(),
  oportunidade: z.uuid(),
  acao: z.string().trim().min(3).max(500),
  quando: z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
  etapa: z.union([
    z.literal('manter'),
    z.enum(ETAPAS_CRM.map((item) => item.id) as [string, ...string[]]),
  ]),
  compromissos: z.array(z.string().trim().min(3).max(500)).max(8),
});

const pendenciaSchema = z.object({
  reuniao: z.uuid(),
  destino: z.enum(['reagendar', 'cancelar']),
});

type CampoAgendamento =
  'oportunidade' | 'tipo' | 'titulo' | 'agendadaPara' | 'duracao' | 'convidadoEmail';

export type EstadoAgendamento = {
  erro?: string;
  porCampo?: Partial<Record<CampoAgendamento, string>>;
  campos?: Partial<Record<CampoAgendamento, string>>;
};

function texto(formData: FormData, nome: string) {
  const valor = formData.get(nome);
  return typeof valor === 'string' ? valor : '';
}

function dataUtc(local: string, offsetMinutos: number) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!partes) return new Date(Number.NaN);
  const ano = Number(partes[1]!);
  const mes = Number(partes[2]!);
  const dia = Number(partes[3]!);
  const horas = Number(partes[4]!);
  const minutos = Number(partes[5]!);
  return new Date(Date.UTC(ano, mes - 1, dia, horas, minutos) + offsetMinutos * 60_000);
}

export async function agendarReuniao(
  _estado: EstadoAgendamento,
  formData: FormData,
): Promise<EstadoAgendamento> {
  const campos = {
    oportunidade: texto(formData, 'oportunidade'),
    tipo: texto(formData, 'tipo'),
    titulo: texto(formData, 'titulo'),
    agendadaPara: texto(formData, 'agendadaPara'),
    duracao: texto(formData, 'duracao'),
    convidadoEmail: texto(formData, 'convidadoEmail'),
  };

  const validacao = agendarSchema.safeParse({
    ...campos,
    offsetMinutos: texto(formData, 'offsetMinutos'),
    liveCoach: formData.get('liveCoach') === 'on',
    enviarConviteGoogle: formData.get('enviarConviteGoogle') === 'on',
  });

  if (!validacao.success) {
    const erros = z.flattenError(validacao.error).fieldErrors;
    return {
      campos,
      porCampo: {
        oportunidade: erros.oportunidade?.[0],
        tipo: erros.tipo?.[0],
        titulo: erros.titulo?.[0],
        agendadaPara: erros.agendadaPara?.[0],
        duracao: erros.duracao?.[0],
        convidadoEmail: erros.convidadoEmail?.[0],
      },
    };
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims) return { campos, erro: 'Sua sessão expirou. Entre novamente para continuar.' };

  const { data: conexaoCalendar, error: erroCalendar } = await supabase
    .from('google_calendar_conexoes')
    .select('status')
    .maybeSingle();
  if (erroCalendar || conexaoCalendar?.status !== 'ativa') {
    return {
      campos,
      erro: 'Conecte seu Google Calendar antes de criar o primeiro agendamento.',
    };
  }
  if (!validacao.data.enviarConviteGoogle || !validacao.data.convidadoEmail) {
    return {
      campos,
      erro: 'Informe o e-mail do cliente para criar o convite no Google Calendar.',
    };
  }

  const quando = dataUtc(validacao.data.agendadaPara, validacao.data.offsetMinutos);
  if (Number.isNaN(quando.getTime())) {
    return { campos, porCampo: { agendadaPara: 'Escolha uma data válida.' } };
  }

  const { data, error } = await supabase.rpc('calls_agendar_reuniao', {
    p_oportunidade: validacao.data.oportunidade,
    p_tipo: validacao.data.tipo as (typeof TIPOS_CALL)[number]['id'],
    p_agendada_para: quando.toISOString(),
    p_duracao_minutos: validacao.data.duracao,
    p_titulo: validacao.data.titulo || undefined,
    p_live_coach_ativo: validacao.data.liveCoach,
  });

  if (error) {
    console.error(`[calls:agendar] ${error.code}: ${error.message}`);
    return { campos, erro: 'Não foi possível agendar a reunião agora. Tente novamente.' };
  }

  const reuniao = z.object({ reuniao_id: z.uuid(), codigo_publico: z.uuid() }).safeParse(data?.[0]);
  if (!reuniao.success) {
    console.error('[calls:agendar] A call foi criada sem um identificador válido.');
    return {
      campos,
      erro: 'A reunião foi criada, mas não conseguimos abrir a sala preparada. Atualize Reuniões.',
    };
  }

  let calendar: 'sincronizado' | 'falhou' | undefined;
  if (validacao.data.enviarConviteGoogle && validacao.data.convidadoEmail) {
    await supabase
      .from('calls_reunioes')
      .update({
        convidado_email: validacao.data.convidadoEmail,
        google_sync_status: 'sincronizando',
        google_sync_erro: null,
      })
      .eq('id', reuniao.data.reuniao_id);

    const { data: oportunidade, error: erroOportunidade } = await supabase
      .from('crm_oportunidades')
      .select(
        `
          titulo,
          empresa:crm_empresas!crm_oportunidades_empresa_fk(nome),
          contato:crm_contatos!crm_oportunidades_contato_fk(nome)
        `,
      )
      .eq('id', validacao.data.oportunidade)
      .maybeSingle();

    if (erroOportunidade || !oportunidade) {
      console.error('[google-calendar:contexto] Oportunidade não encontrada após criar a call.');
      await supabase
        .from('calls_reunioes')
        .update({
          google_sync_status: 'falhou',
          google_sync_erro: 'Não foi possível preparar os dados do convite.',
        })
        .eq('id', reuniao.data.reuniao_id);
      calendar = 'falhou';
    } else {
      const resultado = await sincronizarCallNoGoogle(supabase, {
        reuniaoId: reuniao.data.reuniao_id,
        codigoPublico: reuniao.data.codigo_publico,
        titulo: validacao.data.titulo || oportunidade.titulo,
        empresa: oportunidade.empresa?.nome ?? 'Cliente',
        contato: oportunidade.contato?.nome ?? null,
        convidadoEmail: validacao.data.convidadoEmail,
        agendadaPara: quando.toISOString(),
        duracaoMinutos: validacao.data.duracao,
      });
      calendar = resultado.status === 'sincronizado' ? 'sincronizado' : 'falhou';
    }
  }

  revalidatePath('/calls');
  revalidatePath('/crm');
  revalidatePath(`/crm/${validacao.data.oportunidade}`);
  revalidarDirecaoOperacional();
  const parametros = new URLSearchParams({ agendada: reuniao.data.reuniao_id });
  if (calendar) parametros.set('calendar', calendar);
  redirect(`/reunioes?${parametros.toString()}`);
}

export async function reenviarConviteGoogle(formData: FormData): Promise<void> {
  const reuniaoId = z.uuid().safeParse(formData.get('reuniao'));
  if (!reuniaoId.success) redirect('/reunioes?calendar=falhou');

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims) redirect('/entrar');

  const { data: reuniao, error } = await supabase
    .from('calls_reunioes')
    .select(
      `
        id,
        codigo_publico,
        titulo,
        agendada_para,
        duracao_minutos,
        convidado_email,
        empresa:crm_empresas!calls_reunioes_empresa_fk(nome),
        contato:crm_contatos!calls_reunioes_contato_fk(nome)
      `,
    )
    .eq('id', reuniaoId.data)
    .maybeSingle();

  if (error || !reuniao?.convidado_email) redirect('/reunioes?calendar=falhou');

  const resultado = await sincronizarCallNoGoogle(supabase, {
    reuniaoId: reuniao.id,
    codigoPublico: reuniao.codigo_publico,
    titulo: reuniao.titulo,
    empresa: reuniao.empresa?.nome ?? 'Cliente',
    contato: reuniao.contato?.nome ?? null,
    convidadoEmail: reuniao.convidado_email,
    agendadaPara: reuniao.agendada_para,
    duracaoMinutos: reuniao.duracao_minutos,
  });

  revalidatePath('/calls');
  const calendar = resultado.status === 'sincronizado' ? 'sincronizado' : 'falhou';
  redirect(`/reunioes?agendada=${reuniao.id}&calendar=${calendar}`);
}

export async function resolverReuniaoPendente(formData: FormData): Promise<void> {
  const validacao = pendenciaSchema.safeParse({
    reuniao: formData.get('reuniao'),
    destino: formData.get('destino'),
  });
  if (!validacao.success) redirect('/reunioes?pendencia=erro');

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims) redirect('/entrar');

  const { data: reuniao, error } = await supabase
    .from('calls_reunioes')
    .select(
      'id, oportunidade_id, tipo, status, agendada_para, duracao_minutos, google_event_id, google_calendar_id',
    )
    .eq('id', validacao.data.reuniao)
    .maybeSingle();

  if (
    error ||
    !reuniao ||
    !callPassouDaJanela({
      status: reuniao.status,
      agendadaPara: reuniao.agendada_para,
      duracaoMinutos: reuniao.duracao_minutos,
    })
  ) {
    redirect('/reunioes?pendencia=erro');
  }

  const remocaoGoogle = await removerCallDoGoogle(supabase, {
    reuniaoId: reuniao.id,
    eventoId: reuniao.google_event_id,
    calendarId: reuniao.google_calendar_id,
  });
  if (remocaoGoogle.status === 'falhou') {
    redirect('/reunioes?pendencia=erro');
  }

  const { error: erroAtualizacao } = await supabase
    .from('calls_reunioes')
    .update({ status: 'cancelada', encerrada_em: new Date().toISOString() })
    .eq('id', reuniao.id)
    .in('status', ['agendada', 'aguardando', 'ao_vivo']);
  if (erroAtualizacao) {
    console.error(`[calls:resolver-pendencia] ${erroAtualizacao.code}: ${erroAtualizacao.message}`);
    redirect('/reunioes?pendencia=erro');
  }

  revalidatePath('/calls');
  revalidatePath('/crm');
  revalidatePath(`/crm/${reuniao.oportunidade_id}`);
  revalidarDirecaoOperacional();

  if (validacao.data.destino === 'reagendar') {
    const parametros = new URLSearchParams({
      nova: '1',
      oportunidade: reuniao.oportunidade_id,
      tipo: reuniao.tipo,
      pendencia: 'reagendar',
    });
    redirect(`/reunioes?${parametros.toString()}`);
  }
  redirect('/reunioes?pendencia=cancelada');
}

export async function aplicarPlanoCall(formData: FormData): Promise<void> {
  const validacao = proximaAcaoSchema.safeParse({
    reuniao: formData.get('reuniao'),
    oportunidade: formData.get('oportunidade'),
    acao: formData.get('acao'),
    quando: formData.get('quando'),
    etapa: formData.get('etapa'),
    compromissos: formData.getAll('compromissos'),
  });
  const reuniao = texto(formData, 'reuniao');
  if (!validacao.success) redirect(`/reunioes/${reuniao}?plano=erro`);

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims) redirect('/entrar');

  const quando = validacao.data.quando ? `${validacao.data.quando}T12:00:00-03:00` : undefined;
  const { data, error } = await supabase.rpc('calls_aplicar_plano', {
    p_reuniao: validacao.data.reuniao,
    p_acao: validacao.data.acao,
    p_quando: quando,
    p_etapa: validacao.data.etapa === 'manter' ? undefined : (validacao.data.etapa as EtapaCrm),
    p_compromissos: validacao.data.compromissos,
  });

  if (error) {
    console.error(`[calls:aplicar-plano] ${error.code}: ${error.message}`);
    redirect(`/reunioes/${validacao.data.reuniao}?plano=erro`);
  }

  revalidatePath('/calls');
  revalidatePath(`/calls/${validacao.data.reuniao}`);
  revalidatePath('/crm');
  revalidatePath(`/crm/${validacao.data.oportunidade}`);
  revalidatePath('/solucoes');
  revalidarDirecaoOperacional();
  const aplicado = Boolean(
    data && typeof data === 'object' && !Array.isArray(data) && data.aplicado,
  );
  redirect(
    `/reunioes/${validacao.data.reuniao}?plano=${aplicado ? 'ok' : 'sem-alteracao'}#proximo-passo-pos-call`,
  );
}
