'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { revalidarDirecaoOperacional } from '@/lib/consultor/revalidacao';
import { ETAPAS_CRM, type EtapaCrm } from '@/lib/crm/etapas';

const schema = z.object({
  reuniao: z.uuid(),
  oportunidade: z.uuid(),
  acao: z.string().trim().min(3).max(500),
  quando: z.union([z.literal(''), z.iso.date()]),
  etapa: z.union([
    z.literal('manter'),
    z.enum(ETAPAS_CRM.map((item) => item.id) as [string, ...string[]]),
  ]),
  compromissos: z.array(z.string().trim().min(3).max(500)).max(8),
});

export type EstadoPlanoCall = { erro?: string; tituloErro?: string; sucesso?: string };

/** Falhas retornam ao formulário, sem navegar nem descartar a revisão. */
export async function salvarPlanoCall(
  _estado: EstadoPlanoCall,
  formData: FormData,
): Promise<EstadoPlanoCall> {
  const validacao = schema.safeParse({
    reuniao: formData.get('reuniao'),
    oportunidade: formData.get('oportunidade'),
    acao: formData.get('acao'),
    quando: formData.get('quando'),
    etapa: formData.get('etapa'),
    compromissos: formData.getAll('compromissos'),
  });
  if (!validacao.success) {
    return { erro: 'Revise a ação, a data e os compromissos. Suas escolhas foram mantidas.' };
  }

  const supabase = await createClient();
  const { data: sessao, error: erroSessao } = await supabase.auth.getUser();
  if (erroSessao || !sessao.user) {
    return { erro: 'Sua sessão expirou. Entre novamente em outra aba e tente salvar aqui.' };
  }
  const dados = validacao.data;
  const { data: reuniao, error: erroReuniao } = await supabase
    .from('calls_reunioes')
    .select('oportunidade_id')
    .eq('id', dados.reuniao)
    .eq('dono', sessao.user.id)
    .maybeSingle();
  if (erroReuniao || !reuniao || reuniao.oportunidade_id !== dados.oportunidade) {
    return { erro: 'Não foi possível acessar esta reunião. Sua revisão continua aqui.' };
  }

  const { data, error } = await supabase.rpc('calls_aplicar_plano', {
    p_reuniao: dados.reuniao,
    p_acao: dados.acao,
    p_quando: dados.quando ? `${dados.quando}T12:00:00-03:00` : undefined,
    p_etapa: dados.etapa === 'manter' ? undefined : (dados.etapa as EtapaCrm),
    p_compromissos: dados.compromissos,
  });
  if (error || !data || typeof data !== 'object' || Array.isArray(data) || !data.aplicado) {
    if (error) console.error(`[calls:aplicar-plano] ${error.code}`);
    return {
      erro:
        error?.message === 'data_invalida'
          ? 'Escolha uma data de hoje até os próximos dois anos. Sua revisão foi mantida.'
          : 'Não foi possível salvar o plano. Suas escolhas foram mantidas; tente novamente.',
    };
  }

  revalidatePath('/calls');
  revalidatePath(`/calls/${dados.reuniao}`);
  revalidatePath('/crm');
  revalidatePath(`/crm/${reuniao.oportunidade_id}`);
  revalidatePath('/entregas');
  revalidarDirecaoOperacional();
  return { sucesso: 'Plano salvo na ficha do cliente.' };
}
