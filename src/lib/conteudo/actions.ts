'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { ZodError } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { ehAdmin } from '@/lib/auth/papeis';
import { handleError } from '@/lib/errors';
import { formacaoSchema, solucaoSchema } from './schemas';

export type EstadoConteudo = {
  erro?: string;
  porCampo?: Record<string, string>;
};

function texto(valor: FormDataEntryValue | null): string {
  return typeof valor === 'string' ? valor : '';
}

function deZod(erro: ZodError): EstadoConteudo {
  const porCampo: Record<string, string> = {};
  for (const issue of erro.issues) {
    const chave = issue.path[0];
    if (typeof chave === 'string' && !porCampo[chave]) porCampo[chave] = issue.message;
  }
  return { porCampo };
}

/**
 * Guarda de escrita.
 *
 * A RLS já reprova quem não é admin — este check é a SEGUNDA barreira, e existe
 * por dois motivos. Primeiro, erro de RLS chega como código de banco e viraria
 * "não foi possível completar a ação" para alguém que na verdade não tem
 * permissão; aqui a mensagem é honesta. Segundo, sem ele um não-admin conseguiria
 * disparar a Server Action e gastar uma ida ao banco a cada tentativa.
 */
async function exigirAdmin(): Promise<EstadoConteudo | null> {
  if (await ehAdmin()) return null;
  return { erro: 'Só administradores podem alterar conteúdo.' };
}

/**
 * `publicado_em` é carimbado na PRIMEIRA publicação e nunca reescrito depois.
 * Sem o `?? new Date()`, despublicar e republicar reescreveria a data e a ordem
 * cronológica do catálogo mudaria sozinha.
 */
function carimbo(status: string, anterior: string | null): string | null {
  if (status !== 'publicado') return anterior;
  return anterior ?? new Date().toISOString();
}

export async function salvarSolucao(
  _anterior: EstadoConteudo,
  formData: FormData,
): Promise<EstadoConteudo> {
  const negado = await exigirAdmin();
  if (negado) return negado;

  const parsed = solucaoSchema.safeParse({
    titulo: texto(formData.get('titulo')),
    slug: texto(formData.get('slug')),
    resumo: texto(formData.get('resumo')),
    categoria: texto(formData.get('categoria')),
    video_url: texto(formData.get('video_url')),
    capa_url: texto(formData.get('capa_url')),
    status: texto(formData.get('status')),
  });
  if (!parsed.success) return deZod(parsed.error);

  const id = texto(formData.get('id'));
  const supabase = await createClient();

  if (id) {
    const { data: atual } = await supabase
      .from('solucoes')
      .select('publicado_em')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('solucoes')
      .update({
        ...parsed.data,
        publicado_em: carimbo(parsed.data.status, atual?.publicado_em ?? null),
      })
      .eq('id', id);

    if (error) return { erro: handleError(error, 'admin:solucao:atualizar').message };
  } else {
    const { data: sessao } = await supabase.auth.getClaims();
    const { error } = await supabase.from('solucoes').insert({
      ...parsed.data,
      publicado_em: carimbo(parsed.data.status, null),
      criado_por: sessao?.claims.sub ?? null,
    });

    if (error) {
      /* 23505 = unique_violation. Aqui só existe um índice único, o do slug, então
         a mensagem pode ser específica e apontar o campo certo. */
      if (error.code === '23505') {
        return { porCampo: { slug: 'Já existe uma solução com esse endereço.' } };
      }
      return { erro: handleError(error, 'admin:solucao:criar').message };
    }
  }

  revalidatePath('/admin/solucoes');
  redirect('/admin/solucoes');
}

export async function salvarFormacao(
  _anterior: EstadoConteudo,
  formData: FormData,
): Promise<EstadoConteudo> {
  const negado = await exigirAdmin();
  if (negado) return negado;

  const parsed = formacaoSchema.safeParse({
    titulo: texto(formData.get('titulo')),
    slug: texto(formData.get('slug')),
    resumo: texto(formData.get('resumo')),
    capa_url: texto(formData.get('capa_url')),
    status: texto(formData.get('status')),
  });
  if (!parsed.success) return deZod(parsed.error);

  const id = texto(formData.get('id'));
  const supabase = await createClient();

  if (id) {
    const { data: atual } = await supabase
      .from('formacoes')
      .select('publicado_em')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('formacoes')
      .update({
        ...parsed.data,
        publicado_em: carimbo(parsed.data.status, atual?.publicado_em ?? null),
      })
      .eq('id', id);

    if (error) return { erro: handleError(error, 'admin:formacao:atualizar').message };
  } else {
    const { data: sessao } = await supabase.auth.getClaims();
    const { error } = await supabase.from('formacoes').insert({
      ...parsed.data,
      publicado_em: carimbo(parsed.data.status, null),
      criado_por: sessao?.claims.sub ?? null,
    });

    if (error) {
      if (error.code === '23505') {
        return { porCampo: { slug: 'Já existe uma formação com esse endereço.' } };
      }
      return { erro: handleError(error, 'admin:formacao:criar').message };
    }
  }

  revalidatePath('/admin/formacoes');
  redirect('/admin/formacoes');
}

/**
 * Exclusão.
 *
 * O `on delete cascade` das tabelas filhas leva itens, módulos e aulas junto — é
 * por isso que a tela pede confirmação escrita antes de chamar isto.
 */
export async function excluirSolucao(formData: FormData) {
  if (!(await ehAdmin())) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from('solucoes')
    .delete()
    .eq('id', texto(formData.get('id')));
  if (error) handleError(error, 'admin:solucao:excluir');

  revalidatePath('/admin/solucoes');
  redirect('/admin/solucoes');
}

export async function excluirFormacao(formData: FormData) {
  if (!(await ehAdmin())) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from('formacoes')
    .delete()
    .eq('id', texto(formData.get('id')));
  if (error) handleError(error, 'admin:formacao:excluir');

  revalidatePath('/admin/formacoes');
  redirect('/admin/formacoes');
}
