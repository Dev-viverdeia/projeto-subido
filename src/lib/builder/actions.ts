'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { handleError } from '@/lib/errors';

/**
 * As duas mutações do Builder que NÃO chamam o modelo.
 *
 * São Server Actions e não rotas porque não têm o problema que criou as rotas:
 * duram milissegundos e não precisam de `maxDuration` próprio. Gerar continua em
 * `/api/builder/*` porque leva dezenas de segundos.
 *
 * A AUTORIZAÇÃO É DA RLS, e o `getUser()` aqui é só para a mensagem sair honesta.
 * A policy é `dono = auth.uid()` nas quatro operações: um id alheio simplesmente
 * não casa nenhuma linha, e o update/delete "funciona" afetando zero linhas — que
 * é o comportamento certo, porque não revela se o id existe.
 */

const Id = z.uuid();

async function clienteAutenticado() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? supabase : null;
}

/**
 * Devolve uma solução travada em `gerando` para a entrevista.
 *
 * POR QUE ISTO EXISTE: a geração roda dentro do request. Se a função morre no
 * meio — deploy, timeout da plataforma, aba fechada num runtime que encerra —,
 * o status fica `gerando` para sempre. A tela desse estado dizia "volte à
 * entrevista e gere de novo" e não havia como voltar: `/builder/[id]` só mostra
 * a entrevista em `rascunho` ou `falhou`. Era um beco sem saída com instrução
 * de saída escrita.
 *
 * Não há trava contra a geração original terminar depois e gravar `pronta` por
 * cima. É o desfecho certo: se o documento chegou, ele vale mais que o rascunho.
 */
export async function voltarParaEntrevista(formData: FormData): Promise<void> {
  const id = Id.safeParse(formData.get('id'));
  if (!id.success) return;

  const supabase = await clienteAutenticado();
  if (!supabase) return;

  const { error } = await supabase
    .from('builder_solucoes')
    .update({ status: 'rascunho', erro: null })
    .eq('id', id.data)
    /* Só destrava o que está travado. Sem este filtro, um clique atrasado
       rebaixaria para rascunho uma solução que acabou de ficar pronta. */
    .eq('status', 'gerando');

  if (error) throw handleError(error, 'builder:destravar');

  revalidatePath(`/builder/${id.data}`);
  revalidatePath('/builder');
}

/**
 * Apaga um projeto.
 *
 * Sem lixeira e sem desfazer, e é por isso que a confirmação em dois toques do
 * `BotaoExcluir` não é opcional aqui. O material é privado do implementador: não
 * existe cópia em catálogo nem em outra tela de onde recuperar.
 */
export async function apagarSolucao(formData: FormData): Promise<void> {
  const id = Id.safeParse(formData.get('id'));
  if (!id.success) return;

  const supabase = await clienteAutenticado();
  if (!supabase) return;

  const { error } = await supabase.from('builder_solucoes').delete().eq('id', id.data);
  if (error) throw handleError(error, 'builder:apagar');

  revalidatePath('/builder');
  /* `redirect` lança por dentro — precisa ficar FORA de qualquer try/catch, e
     por isso esta função não tem um. */
  redirect('/builder');
}
