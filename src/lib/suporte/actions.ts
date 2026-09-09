'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { ehAdmin } from '@/lib/auth/papeis';
import { usuarioSuporte, equipeSuporte, acessoPublico, criarSistemaSuporte } from './servidor';
import {
  ArtigoSchema,
  CriarSchema,
  ResponderSchema,
  StatusSchema,
  paginaSegura,
  type ResultadoSuporte,
} from './contrato';

const falha = (
  erro = 'Não foi possível salvar. Seu texto continua aqui para tentar novamente.',
): ResultadoSuporte => ({ ok: false, erro });
function atualizar(id?: string) {
  revalidatePath('/suporte');
  revalidatePath('/suporte/equipe');
  if (id) {
    revalidatePath(`/suporte/${id}`);
    revalidatePath(`/suporte/equipe/${id}`);
    revalidatePath(`/ajuda/atendimento/${id}`);
  }
}
export async function criarAtendimento(entrada: unknown): Promise<ResultadoSuporte> {
  const p = CriarSchema.safeParse(entrada);
  if (!p.success) return falha(p.error.issues[0]?.message);
  if (!(await usuarioSuporte()))
    return falha('Entre na conta para enviar. Se não conseguir, use Problema de acesso.');
  const db = await createClient();
  const { data, error } = await db.rpc('suporte_criar', {
    p_id: p.data.id,
    p_assunto: p.data.assunto,
    p_categoria: p.data.categoria,
    p_texto: p.data.texto,
    // O gerador omite NULL em argumentos SQL; a função aceita origem ausente.
    // @ts-expect-error NULL é previsto pelo contrato SQL de p_pagina.
    p_pagina: paginaSegura(p.data.pagina),
    p_anexos: p.data.anexos,
  });
  if (error)
    return falha(
      error.message === 'limite'
        ? 'Você já enviou vários pedidos hoje. Continue em um atendimento existente.'
        : undefined,
    );
  atualizar();
  return { ok: true, id: data };
}
export async function responderAtendimento(entrada: unknown): Promise<ResultadoSuporte> {
  const p = ResponderSchema.safeParse(entrada);
  if (!p.success) return falha('Escreva uma mensagem de até 6.000 caracteres.');
  if (!(await usuarioSuporte()))
    return falha('Sua sessão terminou. Entre novamente antes de enviar.');
  const db = await createClient();
  const { error } = await db.rpc('suporte_responder', {
    p_id: p.data.id,
    p_atendimento: p.data.atendimento,
    p_texto: p.data.texto,
    p_interna: p.data.interna,
    p_anexos: p.data.anexos,
  });
  if (error) return falha();
  atualizar(p.data.atendimento);
  return { ok: true };
}
export async function atualizarAtendimento(entrada: unknown): Promise<ResultadoSuporte> {
  const p = z
    .object({
      id: z.uuid(),
      status: StatusSchema.optional(),
      responsavel: z.uuid().nullable().optional(),
      prioridade: z.enum(['normal', 'alta']).optional(),
      avaliacao: z.number().int().min(1).max(5).optional(),
    })
    .safeParse(entrada);
  if (!p.success || !(await usuarioSuporte()))
    return falha('Pedido inválido. Entre novamente e tente de novo.');
  const db = await createClient();
  const { error } = await db.rpc('suporte_atualizar', {
    p_id: p.data.id,
    p_status: p.data.status,
    p_atribuir: p.data.responsavel !== undefined,
    p_responsavel: p.data.responsavel ?? undefined,
    p_prioridade: p.data.prioridade,
    p_avaliacao: p.data.avaliacao,
  });
  if (error) return falha('Não foi possível atualizar o atendimento. Tente novamente.');
  atualizar(p.data.id);
  return { ok: true };
}
export async function marcarLido(id: string): Promise<void> {
  if (!z.uuid().safeParse(id).success || !(await usuarioSuporte())) return;
  const db = await createClient();
  await db.rpc('suporte_marcar_lido', { p_id: id });
}
export async function avaliarGuia(slug: string, util: boolean): Promise<ResultadoSuporte> {
  if (!(await usuarioSuporte())) return falha('Entre na conta para avaliar o guia.');
  if (
    !z
      .string()
      .regex(/^[a-z0-9-]{3,80}$/)
      .safeParse(slug).success ||
    typeof util !== 'boolean'
  )
    return falha();
  const db = await createClient();
  const { error } = await db.rpc('suporte_avaliar_artigo', { p_slug: slug, p_util: util });
  return error ? falha() : { ok: true };
}
export async function salvarArtigo(entrada: unknown): Promise<ResultadoSuporte> {
  if (!(await ehAdmin())) return falha('Você não tem permissão para editar guias.');
  const p = ArtigoSchema.safeParse(entrada);
  if (!p.success) return falha('Confira os campos e os limites do guia.');
  const db = await createClient();
  const { error } = await db
    .from('suporte_artigos')
    .upsert({ ...p.data, atualizado_em: new Date().toISOString() });
  if (error) return falha();
  revalidatePath('/ajuda');
  revalidatePath(`/ajuda/${p.data.slug}`);
  revalidatePath('/suporte/equipe/guias');
  return { ok: true };
}
export async function configurarAgente(entrada: unknown): Promise<ResultadoSuporte> {
  if (!(await ehAdmin())) return falha('Somente administradores podem alterar a equipe.');
  const p = z
    .object({
      usuario: z.uuid(),
      nome: z.string().trim().min(1).max(100),
      notificar: z.boolean(),
      remover: z.boolean().optional(),
    })
    .safeParse(entrada);
  if (!p.success) return falha('Confira a pessoa e o nome.');
  const db = await createClient();
  const { error } = p.data.remover
    ? await db.from('suporte_agentes').delete().eq('usuario', p.data.usuario)
    : await db
        .from('suporte_agentes')
        .upsert({ usuario: p.data.usuario, nome: p.data.nome, notificar: p.data.notificar });
  if (error) return falha('Não foi possível atualizar a equipe. Confira se a conta existe.');
  revalidatePath('/suporte/equipe');
  return { ok: true };
}
export async function responderPublico(entrada: unknown): Promise<ResultadoSuporte> {
  const p = z
    .object({
      id: z.uuid(),
      atendimento: z.uuid(),
      texto: z.string().trim().min(1).max(6000),
      status: z.enum(['resolvido', 'em_atendimento']).optional(),
    })
    .safeParse(entrada);
  if (!p.success) return falha();
  const acesso = await acessoPublico(p.data.atendimento);
  if (!acesso) return falha('O link de acesso expirou. Peça um novo link nesta página.');
  const { error } = await criarSistemaSuporte().rpc('suporte_publico_responder', {
    p_id: p.data.atendimento,
    p_hash: acesso.hash,
    p_mensagem: p.data.id,
    p_texto: p.data.texto,
    p_status: p.data.status,
  });
  if (error) return falha();
  atualizar(p.data.atendimento);
  return { ok: true };
}
export async function assumirAtendimento(id: string): Promise<ResultadoSuporte> {
  const user = await usuarioSuporte();
  if (!user || !(await equipeSuporte())) return falha();
  const db = await createClient();
  const { data } = await db
    .from('suporte_agentes')
    .select('usuario')
    .eq('usuario', user.id)
    .maybeSingle();
  if (!data) return falha('Adicione sua conta à equipe antes de assumir o atendimento.');
  return atualizarAtendimento({ id, responsavel: user.id, status: 'em_atendimento' });
}

export async function adicionarAgente(email: string): Promise<ResultadoSuporte> {
  if (!(await ehAdmin()) || !z.email().safeParse(email).success)
    return falha('Confira o e-mail da pessoa.');
  const { data, error } = await criarSistemaSuporte()
    .from('admin_contas')
    .select('usuario_id,nome,email')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();
  if (error || !data) return falha('Não encontramos uma conta com esse e-mail.');
  return configurarAgente({
    usuario: data.usuario_id,
    nome: data.nome || data.email?.split('@')[0] || 'Atendente',
    notificar: true,
  });
}
