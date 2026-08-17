'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { revalidarDirecaoOperacional } from '@/lib/consultor/revalidacao';
import { prospeccaoEnv } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';
import {
  concluirListaProspeccao,
  enviarLeadProspeccaoAoCrm,
  falharListaProspeccao,
  registrarContatoLeadProspeccao,
  reservarListaProspeccao,
} from './admin';
import { prospectarEmpresas } from './provedores';
import {
  BuscaProspeccaoSchema,
  CanalContatoProspeccaoSchema,
  StatusContatoProspeccaoSchema,
} from './schema';

export type EstadoBuscaProspeccao = {
  erro?: string;
  porCampo?: Partial<Record<'segmento' | 'localizacao' | 'quantidade', string>>;
  campos?: {
    segmento: string;
    localizacao: string;
    quantidade: string;
  };
};

const RegistroContatoSchema = z.object({
  lead: z.uuid(),
  canal: CanalContatoProspeccaoSchema.nullable(),
  status: StatusContatoProspeccaoSchema.exclude(['no_crm']),
});

export type ResultadoContatoProspeccao =
  { ok: true; status: z.infer<typeof StatusContatoProspeccaoSchema> } | { ok: false; erro: string };

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

  try {
    const resultado = await prospectarEmpresas(validacao.data);
    const { error } = await concluirListaProspeccao(user.id, lista, resultado);
    if (error) throw error;
  } catch (erro) {
    console.error('[prospeccao:buscar] falha ao montar lista:', erro);
    await falharListaProspeccao(user.id, lista);
    revalidatePath('/prospeccao');
    redirect(`/prospeccao?lista=${lista}&busca=falhou`);
  }

  revalidatePath('/prospeccao');
  redirect(`/prospeccao?lista=${lista}&busca=concluida`);
}

export async function enviarLeadAoCrm(formData: FormData): Promise<void> {
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
  redirect(`/crm/${oportunidade.data}?novo=1&origem=prospeccao`);
}

export async function registrarContatoProspeccao(
  entrada: unknown,
): Promise<ResultadoContatoProspeccao> {
  const validacao = RegistroContatoSchema.safeParse(entrada);
  if (!validacao.success) return { ok: false, erro: 'Não foi possível registrar esta ação.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: 'Sua sessão expirou. Entre novamente para continuar.' };

  const { error } = await registrarContatoLeadProspeccao(
    user.id,
    validacao.data.lead,
    validacao.data.canal,
    validacao.data.status,
  );
  if (error) {
    console.error(`[prospeccao:contato] ${error.code ?? 'sem-codigo'}: ${error.message ?? ''}`);
    return { ok: false, erro: 'Não foi possível atualizar o andamento agora.' };
  }

  revalidatePath('/prospeccao');
  return { ok: true, status: validacao.data.status };
}
