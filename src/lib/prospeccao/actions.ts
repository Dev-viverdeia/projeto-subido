'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { after } from 'next/server';
import { z } from 'zod';
import { revalidarDirecaoOperacional } from '@/lib/consultor/revalidacao';
import { prospeccaoEnv } from '@/lib/env';
import { exigirRecurso } from '@/lib/planos/server';
import { createClient } from '@/lib/supabase/server';
import {
  enviarLeadProspeccaoAoCrm,
  registrarContatoProspeccao,
  reservarListaProspeccao,
} from './admin';
import { processarListaProspeccao } from './processar';
import { BuscaProspeccaoSchema, CanalContatoProspeccaoSchema } from './schema';

export type EstadoBuscaProspeccao = {
  erro?: string;
  porCampo?: Partial<Record<'segmento' | 'localizacao' | 'quantidade', string>>;
  campos?: {
    segmento: string;
    localizacao: string;
    quantidade: string;
  };
};

function camposDo(formData: FormData): NonNullable<EstadoBuscaProspeccao['campos']> {
  const valor = (nome: string) => {
    const recebido = formData.get(nome);
    return typeof recebido === 'string' ? recebido : '';
  };
  return {
    segmento: valor('segmento'),
    localizacao: valor('localizacao'),
    quantidade: valor('quantidade'),
  };
}

export async function criarListaProspeccao(
  _estado: EstadoBuscaProspeccao,
  formData: FormData,
): Promise<EstadoBuscaProspeccao> {
  await exigirRecurso('modulo_comercial');
  const campos = camposDo(formData);
  const validacao = BuscaProspeccaoSchema.safeParse(campos);
  if (!validacao.success) {
    const erros = z.flattenError(validacao.error).fieldErrors;
    return {
      campos,
      porCampo: {
        segmento: erros.segmento?.[0],
        localizacao: erros.localizacao?.[0],
        quantidade: erros.quantidade?.[0],
      },
    };
  }

  if (!prospeccaoEnv().pronto) {
    return {
      campos,
      erro: 'A busca está temporariamente indisponível. Nenhum crédito foi usado.',
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { campos, erro: 'Sua sessão expirou. Entre novamente para continuar.' };

  const nome = `${validacao.data.segmento} · ${validacao.data.localizacao}`;
  const { data: lista, error: erroLista } = await reservarListaProspeccao(
    user.id,
    nome,
    validacao.data,
  );

  if (erroLista || !lista) {
    const semCreditos = erroLista?.message.includes('creditos_insuficientes');
    return {
      campos,
      erro: semCreditos
        ? 'Você não tem créditos suficientes para esta lista. Reduza a quantidade.'
        : 'Não foi possível iniciar a busca agora. Tente novamente.',
    };
  }

  after(() => processarListaProspeccao({ dono: user.id, lista, busca: validacao.data }));
  redirect(`/prospeccao?lista=${lista}&busca=processando`);
}

export async function enviarLeadAoCrm(formData: FormData): Promise<void> {
  await exigirRecurso('modulo_comercial');
  const lead = z.uuid().safeParse(formData.get('lead'));
  if (!lead.success) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');

  const { data, error } = await enviarLeadProspeccaoAoCrm(user.id, lead.data);
  const oportunidade = z.uuid().safeParse(data);
  if (error || !oportunidade.success) {
    console.error(`[prospeccao:crm] ${error?.code ?? 'sem-id'}: ${error?.message ?? ''}`);
    redirect('/prospeccao?crm=erro');
  }

  revalidatePath('/prospeccao');
  revalidatePath('/crm');
  revalidarDirecaoOperacional();
  redirect(`/vendas/${oportunidade.data}?novo=1&origem=prospeccao`);
}

const registrarTentativaSchema = z.object({
  lead: z.uuid(),
  canal: CanalContatoProspeccaoSchema,
});

/**
 * Registra uma abordagem quando a pessoa abre um canal público da empresa.
 * A ação nunca bloqueia o contato: se o registro falhar, WhatsApp, telefone ou
 * e-mail continuam abrindo normalmente.
 */
export async function registrarTentativaContato(entrada: {
  lead: string;
  canal: string;
}): Promise<{ ok: boolean }> {
  await exigirRecurso('modulo_comercial');
  const validacao = registrarTentativaSchema.safeParse(entrada);
  if (!validacao.success) return { ok: false };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await registrarContatoProspeccao(
    user.id,
    validacao.data.lead,
    validacao.data.canal,
  );
  if (error) {
    console.error(`[prospeccao:contato] ${error.code}: ${error.message}`);
    return { ok: false };
  }

  revalidatePath('/prospeccao');
  revalidatePath('/metricas');
  revalidarDirecaoOperacional();
  return { ok: true };
}
