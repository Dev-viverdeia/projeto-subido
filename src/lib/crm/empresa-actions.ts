'use server';

import { revalidatePath } from 'next/cache';
import { handleError } from '@/lib/errors';
import { obterAcessoRecurso } from '@/lib/planos/server';
import { createClient } from '@/lib/supabase/server';
import { revalidarDirecaoOperacional } from '@/lib/consultor/revalidacao';
import {
  empresaFichaSchema,
  type EntradaEmpresaFicha,
  type ResultadoEmpresaFicha,
} from './empresa-schema';

export async function salvarEmpresaFicha(
  entrada: EntradaEmpresaFicha,
): Promise<ResultadoEmpresaFicha> {
  const acesso = await obterAcessoRecurso('vendas');
  if (!acesso.permitido)
    return {
      ok: false,
      erro:
        acesso.motivo === 'sessao'
          ? 'Sua sessão expirou. Entre novamente para salvar a empresa.'
          : 'Seu plano não permite editar empresas em Vendas.',
    };
  const validacao = empresaFichaSchema.safeParse(entrada);
  if (!validacao.success) {
    const porCampo: Partial<Record<'nome' | 'site', string>> = {};
    for (const problema of validacao.error.issues) {
      const campo = problema.path[0];
      if (campo === 'nome' || campo === 'site') porCampo[campo] ??= problema.message;
    }
    return { ok: false, erro: 'Revise os campos antes de salvar.', porCampo };
  }
  const dados = validacao.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc('crm_editar_empresa', {
    p_oportunidade: dados.oportunidade,
    p_empresa: dados.empresaId,
    p_revisao: dados.revisao,
    p_nome: dados.nome,
    p_dominio: dados.site,
  });
  if (error) {
    const visivel = handleError(error, 'crm:editar-empresa');
    if (error.code === '40001')
      return {
        ok: false,
        conflito: true,
        erro: 'Esta empresa mudou em outra edição. Cancele e reabra para conferir os dados atuais.',
      };
    return { ok: false, erro: visivel.message };
  }
  // A empresa pode estar vinculada a várias fichas; documentos enviados são snapshots.
  for (const caminho of ['/crm', '/vendas', '/reunioes', '/calls', '/propostas', '/entregas'])
    revalidatePath(caminho, 'layout');
  revalidarDirecaoOperacional();
  return { ok: true };
}
