'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { revalidarDirecaoOperacional } from '@/lib/consultor/revalidacao';
import { executarAlteracaoAgenda } from './agenda-servico';
import { dataLocalParaUtc } from './agenda-modelo';
import { planoDosMetadados, planoTemRecurso } from '@/lib/planos/acessos';
import { callPassouDaJanela, TIPOS_CALL } from './tipos';

const tipos = TIPOS_CALL.map((tipo) => tipo.id) as [string, ...string[]];

const agendarSchema = z
  .object({
    oportunidade: z.union([z.literal(''), z.uuid('Escolha um cliente em Vendas.')]),
    empresa: z.string().trim().max(160, 'Nome da empresa muito longo.'),
    contato: z.string().trim().max(160, 'Nome do contato muito longo.'),
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

const pendenciaSchema = z.object({
  reuniao: z.uuid(),
  destino: z.enum(['reagendar', 'cancelar']),
});

type CampoAgendamento =
  | 'oportunidade'
  | 'empresa'
  | 'contato'
  | 'tipo'
  | 'titulo'
  | 'agendadaPara'
  | 'duracao'
  | 'convidadoEmail';
type CamposPreservados = Partial<Record<CampoAgendamento | 'liveCoach', string>>;

export type EstadoAgendamento = {
  erro?: string;
  reconectar?: boolean;
  entrar?: boolean;
  conferir?: boolean;
  porCampo?: Partial<Record<CampoAgendamento, string>>;
  campos?: CamposPreservados;
};

function texto(formData: FormData, nome: string) {
  const valor = formData.get(nome);
  return typeof valor === 'string' ? valor : '';
}

export async function agendarReuniao(
  _estado: EstadoAgendamento,
  formData: FormData,
): Promise<EstadoAgendamento> {
  const campos = {
    oportunidade: texto(formData, 'oportunidade'),
    empresa: texto(formData, 'empresa'),
    contato: texto(formData, 'contato'),
    tipo: texto(formData, 'tipo'),
    titulo: texto(formData, 'titulo'),
    agendadaPara: texto(formData, 'agendadaPara'),
    duracao: texto(formData, 'duracao'),
    convidadoEmail: texto(formData, 'convidadoEmail'),
    liveCoach: formData.get('liveCoach') === 'on' ? 'on' : '',
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
        empresa: erros.empresa?.[0],
        contato: erros.contato?.[0],
        tipo: erros.tipo?.[0],
        titulo: erros.titulo?.[0],
        agendadaPara: erros.agendadaPara?.[0],
        duracao: erros.duracao?.[0],
        convidadoEmail: erros.convidadoEmail?.[0],
      },
    };
  }

  const supabase = await createClient();
  const { data: sessao, error: erroSessao } = await supabase.auth.getUser();
  if (erroSessao || !sessao.user)
    return {
      campos,
      entrar: true,
      erro: 'Sua sessão expirou. Abra o acesso em outra aba e depois retome este formulário.',
    };
  const plano = planoDosMetadados(sessao.user.app_metadata);
  const comercialLiberado = planoTemRecurso(plano, 'modulo_comercial');

  if (comercialLiberado && !validacao.data.oportunidade) {
    return { campos, porCampo: { oportunidade: 'Escolha um cliente em Vendas.' } };
  }
  if (!comercialLiberado && !validacao.data.empresa) {
    return { campos, porCampo: { empresa: 'Digite o nome da empresa.' } };
  }
  if (!comercialLiberado && !validacao.data.contato) {
    return { campos, porCampo: { contato: 'Digite o nome da pessoa convidada.' } };
  }

  const { data: conexaoCalendar, error: erroCalendar } = await supabase
    .from('google_calendar_conexoes')
    .select('status')
    .maybeSingle();
  if (erroCalendar || conexaoCalendar?.status !== 'ativa') {
    return {
      campos,
      erro: 'Reconecte sua agenda para enviar o convite. Seu preenchimento será mantido.',
      reconectar: true,
    };
  }
  if (!validacao.data.enviarConviteGoogle || !validacao.data.convidadoEmail) {
    return {
      campos,
      erro: 'Informe o e-mail do cliente para criar o convite no Google Calendar.',
    };
  }

  const quando = dataLocalParaUtc(validacao.data.agendadaPara, validacao.data.offsetMinutos);
  if (!quando || quando.getTime() <= Date.now()) {
    return { campos, porCampo: { agendadaPara: 'Escolha uma data e um horário futuros.' } };
  }

  const parametrosComuns = {
    p_tipo: validacao.data.tipo as (typeof TIPOS_CALL)[number]['id'],
    p_agendada_para: quando.toISOString(),
    p_duracao_minutos: validacao.data.duracao,
    p_titulo: validacao.data.titulo || undefined,
    p_live_coach_ativo: validacao.data.liveCoach,
  };
  const { data, error } = comercialLiberado
    ? await supabase.rpc('calls_agendar_reuniao', {
        ...parametrosComuns,
        p_oportunidade: validacao.data.oportunidade,
      })
    : await supabase.rpc('calls_agendar_reuniao_starter', {
        ...parametrosComuns,
        p_empresa_nome: validacao.data.empresa,
        p_contato_nome: validacao.data.contato,
        p_contato_email: validacao.data.convidadoEmail,
      });

  if (error) {
    console.error(`[calls:agendar] ${error.code}: ${error.message}`);
    return { campos, erro: 'Não foi possível agendar a reunião agora. Tente novamente.' };
  }

  const reuniao = z
    .object({
      reuniao_id: z.uuid(),
      codigo_publico: z.uuid(),
      oportunidade_id: z.uuid().optional(),
    })
    .safeParse(data?.[0]);
  if (!reuniao.success) {
    console.error('[calls:agendar] A call foi criada sem um identificador válido.');
    return {
      campos,
      conferir: true,
      erro: 'A reunião foi criada, mas não conseguimos abrir a sala preparada. Atualize Reuniões.',
    };
  }

  let calendar: 'sincronizado' | 'falhou' | undefined;
  const oportunidadeId = comercialLiberado
    ? validacao.data.oportunidade
    : reuniao.data.oportunidade_id;
  if (!oportunidadeId) {
    console.error('[calls:agendar] A reunião foi criada sem vínculo interno válido.');
    return {
      campos,
      conferir: true,
      erro: 'A reunião foi criada, mas não conseguimos preparar o histórico. Atualize Reuniões.',
    };
  }
  if (validacao.data.enviarConviteGoogle && validacao.data.convidadoEmail) {
    const { error: erroConvite } = await supabase
      .from('calls_reunioes')
      .update({
        convidado_email: validacao.data.convidadoEmail,
        google_sync_status: 'falhou',
        google_sync_erro: null,
      })
      .eq('id', reuniao.data.reuniao_id);

    if (erroConvite) {
      console.error('[google-calendar:contexto] Não foi possível salvar o destinatário.');
      calendar = 'falhou';
    } else {
      const resultado = await executarAlteracaoAgenda(supabase, {
        reuniaoId: reuniao.data.reuniao_id,
        dono: sessao.user.id,
        acao: 'sincronizar',
      });
      calendar = resultado.status === 'concluido' ? 'sincronizado' : 'falhou';
    }
  }

  revalidatePath('/calls');
  revalidatePath('/crm');
  revalidatePath(`/crm/${oportunidadeId}`);
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

  const resultado = await executarAlteracaoAgenda(supabase, {
    reuniaoId: reuniaoId.data,
    dono: claims.claims.sub,
    acao: 'sincronizar',
  });

  revalidatePath('/calls');
  const calendar = resultado.status === 'concluido' ? 'sincronizado' : 'falhou';
  redirect(`/reunioes?agendada=${reuniaoId.data}&calendar=${calendar}`);
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
    .select('id, oportunidade_id, tipo, status, agendada_para, duracao_minutos, atualizada_em')
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

  if (validacao.data.destino === 'reagendar') redirect(`/reunioes?editar=${reuniao.id}`);
  const resultado = await executarAlteracaoAgenda(supabase, {
    reuniaoId: reuniao.id,
    dono: claims.claims.sub,
    acao: 'cancelar',
    versao: reuniao.atualizada_em,
  });
  if (resultado.status === 'erro') redirect('/reunioes?pendencia=erro');

  revalidatePath('/calls');
  revalidatePath('/crm');
  revalidatePath(`/crm/${reuniao.oportunidade_id}`);
  revalidarDirecaoOperacional();

  redirect('/reunioes?pendencia=cancelada');
}
