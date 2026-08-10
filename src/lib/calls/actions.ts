'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { ETAPAS_CRM, type EtapaCrm } from '@/lib/crm/etapas';
import { TIPOS_CALL } from './tipos';

const tipos = TIPOS_CALL.map((tipo) => tipo.id) as [string, ...string[]];

const agendarSchema = z.object({
  oportunidade: z.uuid('Escolha uma oportunidade do CRM.'),
  tipo: z.enum(tipos),
  titulo: z.string().trim().max(180, 'Título muito longo.'),
  agendadaPara: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Escolha data e horário.'),
  duracao: z.coerce.number().int().min(15).max(240),
  offsetMinutos: z.coerce.number().int().min(-840).max(840),
  liveCoach: z.boolean(),
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

type CampoAgendamento = 'oportunidade' | 'tipo' | 'titulo' | 'agendadaPara' | 'duracao';

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
  };

  const validacao = agendarSchema.safeParse({
    ...campos,
    offsetMinutos: texto(formData, 'offsetMinutos'),
    liveCoach: formData.get('liveCoach') === 'on',
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
      },
    };
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims) return { campos, erro: 'Sua sessão expirou. Entre novamente para continuar.' };

  const quando = dataUtc(validacao.data.agendadaPara, validacao.data.offsetMinutos);
  if (Number.isNaN(quando.getTime())) {
    return { campos, porCampo: { agendadaPara: 'Escolha uma data válida.' } };
  }

  const { error } = await supabase.rpc('calls_agendar_reuniao', {
    p_oportunidade: validacao.data.oportunidade,
    p_tipo: validacao.data.tipo as (typeof TIPOS_CALL)[number]['id'],
    p_agendada_para: quando.toISOString(),
    p_duracao_minutos: validacao.data.duracao,
    p_titulo: validacao.data.titulo || undefined,
    p_live_coach_ativo: validacao.data.liveCoach,
  });

  if (error) {
    console.error(`[calls:agendar] ${error.code}: ${error.message}`);
    return { campos, erro: 'Não foi possível agendar a call agora. Tente novamente.' };
  }

  revalidatePath('/calls');
  revalidatePath('/crm');
  revalidatePath('/inicio');
  redirect('/calls?agendada=ok');
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
  if (!validacao.success) redirect(`/calls/${reuniao}?plano=erro`);

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
    redirect(`/calls/${validacao.data.reuniao}?plano=erro`);
  }

  revalidatePath('/calls');
  revalidatePath(`/calls/${validacao.data.reuniao}`);
  revalidatePath('/crm');
  revalidatePath(`/crm/${validacao.data.oportunidade}`);
  revalidatePath('/solucoes');
  revalidatePath('/inicio');
  const aplicado = Boolean(
    data && typeof data === 'object' && !Array.isArray(data) && data.aplicado,
  );
  redirect(`/calls/${validacao.data.reuniao}?plano=${aplicado ? 'ok' : 'sem-alteracao'}`);
}
