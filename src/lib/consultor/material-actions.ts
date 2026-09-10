'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { planoDosMetadados, planoTemRecurso } from '@/lib/planos/acessos';
import {
  MaterialDaMensagemSchema,
  ResumoSalvoSchema,
  SalvarMaterialSchema,
  type RevisaoMaterial,
  type ResultadoSalvarMaterial,
} from './material';

/** Lê só o que o seletor precisa, pela sessão atual e pelas RLS do CRM. */
export async function prepararRevisaoMaterial(mensagem: string): Promise<RevisaoMaterial> {
  if (!z.uuid().safeParse(mensagem).success) return { erro: 'Este resumo não está disponível.' };
  try {
    const supabase = await createClient();
    const { data: auth, error: erroAuth } = await supabase.auth.getUser();
    if (erroAuth || !auth.user) return { erro: 'Entre novamente para revisar o resumo.' };
    const dono = auth.user.id;
    if (!planoTemRecurso(planoDosMetadados(auth.user.app_metadata), 'modulo_comercial'))
      return { erro: 'Salvar na ficha está disponível nos planos com Vendas.', plano: true };
    const { data: origem, error: erroOrigem } = await supabase
      .from('consultor_mensagens')
      .select('direcao,consultor_threads!inner(dono)')
      .eq('id', mensagem)
      .eq('papel', 'consultor')
      .eq('consultor_threads.dono', dono)
      .maybeSingle();
    const direcao = origem?.direcao;
    if (
      erroOrigem ||
      !direcao ||
      typeof direcao !== 'object' ||
      Array.isArray(direcao) ||
      !MaterialDaMensagemSchema.safeParse(direcao.material).success
    )
      return { erro: 'Este resumo não está disponível.' };
    const [lista, recibo] = await Promise.all([
      supabase
        .from('crm_oportunidades')
        .select('id,titulo,crm_empresas!inner(nome)')
        .eq('dono', dono)
        .order('atualizado_em', { ascending: false })
        .limit(300),
      supabase
        .from('crm_eventos')
        .select('id,oportunidade_id,criado_em,titulo')
        .eq('dono', dono)
        .eq('fonte', 'sobral_material')
        .eq('fonte_id', mensagem)
        .maybeSingle(),
    ]);
    if (lista.error || recibo.error)
      return { erro: 'Não foi possível carregar as fichas. Tente novamente.' };
    return {
      fichas: (lista.data ?? []).map((f) => ({
        id: f.id,
        titulo: f.titulo,
        nome: f.crm_empresas.nome,
      })),
      salvo: recibo.data
        ? {
            id: recibo.data.id,
            oportunidade: recibo.data.oportunidade_id,
            salvoEm: recibo.data.criado_em,
            titulo: recibo.data.titulo,
          }
        : null,
    };
  } catch {
    return { erro: 'Não foi possível carregar as fichas. Tente novamente.' };
  }
}

export async function salvarResumoMaterial(entrada: unknown): Promise<ResultadoSalvarMaterial> {
  const validacao = SalvarMaterialSchema.safeParse(entrada);
  if (!validacao.success) return { erro: 'Escolha a ficha e revise o resumo antes de salvar.' };
  try {
    const supabase = await createClient();
    const { data: auth, error: erroAuth } = await supabase.auth.getUser();
    if (erroAuth || !auth.user) return { erro: 'Entre novamente para salvar o resumo.' };
    if (!planoTemRecurso(planoDosMetadados(auth.user.app_metadata), 'modulo_comercial'))
      return { erro: 'Seu plano não permite salvar na ficha.' };
    const { mensagem, oportunidade, revisado: _revisado, ...resumo } = validacao.data;
    // A função autoriza de novo, valida a origem e grava uma nota de forma atômica.
    const { data, error } = await supabase.rpc('sobral_salvar_material', {
      p_mensagem: mensagem,
      p_oportunidade: oportunidade,
      p_resumo: resumo,
    });
    if (error)
      return {
        erro:
          error.code === 'PT409'
            ? 'Este resumo já foi salvo com outra revisão. Feche e abra para conferir o registro.'
            : 'Não foi possível confirmar o registro. Tente novamente para conferir.',
      };
    const recibo = ResumoSalvoSchema.safeParse(data);
    if (!recibo.success)
      return { erro: 'Não foi possível confirmar o registro. Tente novamente para conferir.' };
    revalidatePath('/consultor', 'layout');
    revalidatePath(`/vendas/${oportunidade}`);
    revalidatePath(`/crm/${oportunidade}`);
    return { salvo: { ...recibo.data, titulo: resumo.titulo } };
  } catch {
    return { erro: 'Não foi possível confirmar o registro. Tente novamente para conferir.' };
  }
}
