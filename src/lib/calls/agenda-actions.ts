'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { revalidarDirecaoOperacional } from '@/lib/consultor/revalidacao';
import { dataLocalParaUtc } from './agenda-modelo';
import { executarAlteracaoAgenda, type ResultadoAgenda } from './agenda-servico';

export type EstadoAlteracaoAgenda = ResultadoAgenda & {
  campos?: { agendadaPara: string; duracao: string };
};

export async function alterarAgendaReuniao(
  _estado: EstadoAlteracaoAgenda,
  form: FormData,
): Promise<EstadoAlteracaoAgenda> {
  const ler = (campo: string) => {
    const valor = form.get(campo);
    return typeof valor === 'string' ? valor : '';
  };
  const campos = { agendadaPara: ler('agendadaPara'), duracao: ler('duracao') };
  const leitura = z
    .object({
      reuniao: z.uuid(),
      acao: z.enum(['reagendar', 'cancelar', 'sincronizar']),
      versao: z.string().max(50),
    })
    .safeParse({ reuniao: ler('reuniao'), acao: ler('acao'), versao: ler('versao') });
  if (!leitura.success)
    return { status: 'erro', mensagem: 'Atualize a página para abrir esta reunião.', campos };
  const quando = dataLocalParaUtc(campos.agendadaPara, Number(ler('offsetMinutos')));
  const duracao = Number(campos.duracao);
  if (
    leitura.data.acao === 'reagendar' &&
    (!quando ||
      quando.getTime() <= Date.now() ||
      !Number.isInteger(duracao) ||
      duracao < 15 ||
      duracao > 240)
  ) {
    return {
      status: 'erro',
      mensagem: 'Escolha um horário futuro e uma duração entre 15 e 240 minutos.',
      campos,
    };
  }
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims.sub)
    return {
      status: 'erro',
      mensagem: 'Sua sessão expirou. Entre novamente para continuar.',
      campos,
    };
  const resultado = await executarAlteracaoAgenda(supabase, {
    reuniaoId: leitura.data.reuniao,
    dono: data.claims.sub,
    acao: leitura.data.acao,
    versao: leitura.data.versao,
    ...(leitura.data.acao === 'reagendar'
      ? { agendadaPara: quando!.toISOString(), duracaoMinutos: duracao }
      : {}),
  });
  revalidatePath('/reunioes');
  revalidatePath('/calls');
  revalidatePath(`/reunioes/${leitura.data.reuniao}`);
  revalidatePath(`/calls/${leitura.data.reuniao}`);
  revalidarDirecaoOperacional();
  return { ...resultado, campos };
}
