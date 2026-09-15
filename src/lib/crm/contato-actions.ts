'use server';

import { revalidatePath } from 'next/cache';
import { handleError } from '@/lib/errors';
import { obterAcessoRecurso } from '@/lib/planos/server';
import { createClient } from '@/lib/supabase/server';
import { revalidarDirecaoOperacional } from '@/lib/consultor/revalidacao';
import {
  contatoFichaSchema,
  type EntradaContatoFicha,
  type ResultadoContatoFicha,
} from './contato-schema';

export async function salvarContatoFicha(
  entrada: EntradaContatoFicha,
): Promise<ResultadoContatoFicha> {
  const acesso = await obterAcessoRecurso('vendas');
  if (!acesso.permitido)
    return {
      ok: false,
      erro:
        acesso.motivo === 'sessao'
          ? 'Sua sessão expirou. Entre novamente para salvar o contato.'
          : 'Seu plano não permite editar contatos em Vendas.',
    };
  const validacao = contatoFichaSchema.safeParse(entrada);
  if (!validacao.success) {
    const porCampo: Partial<Record<'nome' | 'telefone' | 'email', string>> = {};
    for (const problema of validacao.error.issues) {
      const campo = problema.path[0];
      if (campo === 'nome' || campo === 'telefone' || campo === 'email')
        porCampo[campo] ??= problema.message;
    }
    return { ok: false, erro: 'Revise os campos antes de salvar.', porCampo };
  }
  const valores = validacao.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc('crm_editar_contato', {
    p_oportunidade: valores.oportunidade,
    p_contato: valores.contatoId ?? undefined,
    p_revisao: valores.revisao ?? undefined,
    p_nome: valores.nome,
    p_telefone: valores.telefone,
    p_email: valores.email,
  });
  if (error) {
    const visivel = handleError(error, 'crm:editar-contato');
    if (error.code === '40001')
      return {
        ok: false,
        conflito: true,
        erro: 'Este contato mudou em outra edição. Cancele e reabra para conferir os dados atuais.',
      };
    return { ok: false, erro: visivel.message };
  }
  // Um mesmo contato pode participar de mais de uma oportunidade da mesma empresa.
  revalidatePath('/crm', 'layout');
  revalidatePath('/vendas', 'layout');
  revalidatePath('/reunioes', 'layout');
  revalidatePath('/calls', 'layout');
  revalidarDirecaoOperacional();
  return { ok: true };
}
