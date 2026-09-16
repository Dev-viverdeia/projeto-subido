'use server';

import { revalidatePath } from 'next/cache';
import { handleError } from '@/lib/errors';
import { obterAcessoRecurso } from '@/lib/planos/server';
import { createClient } from '@/lib/supabase/server';
import { revalidarDirecaoOperacional } from '@/lib/consultor/revalidacao';
import {
  vendaFichaSchema,
  valorPrevistoCentavos,
  type EntradaVendaFicha,
  type ResultadoVendaFicha,
} from './venda-schema';

export async function salvarVendaFicha(entrada: EntradaVendaFicha): Promise<ResultadoVendaFicha> {
  const acesso = await obterAcessoRecurso('vendas');
  if (!acesso.permitido)
    return {
      ok: false,
      erro:
        acesso.motivo === 'sessao'
          ? 'Sua sessão expirou. Entre novamente para salvar a venda.'
          : 'Seu plano não permite editar vendas.',
    };
  const validacao = vendaFichaSchema.safeParse(entrada);
  if (!validacao.success) {
    const porCampo: Partial<Record<'titulo' | 'valor', string>> = {};
    for (const problema of validacao.error.issues) {
      const campo = problema.path[0];
      if (campo === 'titulo' || campo === 'valor') porCampo[campo] ??= problema.message;
    }
    return { ok: false, erro: 'Revise os campos antes de salvar.', porCampo };
  }
  const dados = validacao.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc('crm_editar_venda', {
    p_oportunidade: dados.oportunidade,
    p_revisao: dados.revisao,
    p_titulo: dados.titulo,
    p_valor_centavos: valorPrevistoCentavos(dados.valor) ?? undefined,
  });
  if (error) {
    const visivel = handleError(error, 'crm:editar-venda');
    if (error.code === '40001')
      return {
        ok: false,
        conflito: true,
        erro: 'Esta venda mudou em outra edição. Cancele e reabra para conferir os dados atuais.',
      };
    return { ok: false, erro: visivel.message };
  }
  for (const caminho of [
    '/crm',
    '/vendas',
    '/metricas',
    '/reunioes',
    '/calls',
    '/propostas',
    '/entregas',
  ])
    revalidatePath(caminho, 'layout');
  revalidarDirecaoOperacional();
  return { ok: true };
}
