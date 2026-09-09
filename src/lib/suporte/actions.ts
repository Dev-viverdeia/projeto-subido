'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { ehAdmin } from '@/lib/auth/papeis';
import {
  usuarioSuporte,
  equipeSuporte,
  acessoPublico,
  criarSistemaSuporte,
  artigosSuporte,
  detalheAtendimento,
  limitarSuporte,
} from './servidor';
import { responderAjuda } from './ia';
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
  const { error } = await db.rpc('suporte_responder_v2', {
    p_id: p.data.id,
    p_atendimento: p.data.atendimento,
    p_texto: p.data.texto,
    p_interna: p.data.interna,
    p_anexos: p.data.anexos,
    p_resultado: p.data.resultado,
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
export async function marcarLido(id: string, mensagem: string): Promise<void> {
  if (
    !z.uuid().safeParse(id).success ||
    !z.uuid().safeParse(mensagem).success ||
    !(await usuarioSuporte())
  )
    return;
  const db = await createClient();
  await db.rpc('suporte_marcar_visto', { p_id: id, p_mensagem: mensagem });
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
  const { error } = await db.rpc('suporte_assumir', { p_id: id });
  if (error)
    return falha(
      error.message === 'ja_atribuido'
        ? 'Outra pessoa já assumiu. Atualize a conversa antes de transferir.'
        : undefined,
    );
  atualizar(id);
  return { ok: true };
}

export async function salvarConfiguracaoSuporte(entrada: unknown): Promise<ResultadoSuporte> {
  if (!(await ehAdmin())) return falha('Somente administradores podem configurar o suporte.');
  const p = z
    .object({
      horario: z.string().trim().max(180),
      aviso: z.string().trim().max(300),
      meta_horas: z.number().int().min(1).max(168),
    })
    .safeParse(entrada);
  if (!p.success) return falha('Confira o horário, o aviso e a meta.');
  const db = await createClient();
  const { error } = await db
    .from('suporte_configuracao')
    .update({ ...p.data, atualizado_em: new Date().toISOString() })
    .eq('id', true);
  if (error) return falha();
  atualizar();
  revalidatePath('/ajuda');
  return { ok: true };
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

export async function prepararRespostaSuporte(
  id: string,
): Promise<
  { ok: true; sugestao: { texto: string; fontes: string[] } } | { ok: false; erro: string }
> {
  const user = await usuarioSuporte();
  if (!user || !z.uuid().safeParse(id).success || !(await equipeSuporte()))
    return { ok: false, erro: 'Acesso indisponível.' };
  if (!(await limitarSuporte(user.id, 'sugestao-equipe', 20, 3600)))
    return { ok: false, erro: 'Limite de sugestões atingido. Você pode responder normalmente.' };
  const caso = await detalheAtendimento(id, true);
  const ultima = caso?.mensagens.filter((m) => !m.interna && m.papel === 'usuario').at(-1);
  if (!ultima)
    return { ok: false, erro: 'Ainda não há uma pergunta do cliente para orientar a sugestão.' };
  const { resposta } = await responderAjuda(ultima.texto, [], await artigosSuporte());
  return { ok: true, sugestao: { texto: resposta.resposta, fontes: resposta.fontes } };
}

export async function revisarEmailSuporte(
  id: string,
  acao: 'reprocessar' | 'ignorar',
): Promise<ResultadoSuporte> {
  if (
    !z.uuid().safeParse(id).success ||
    !['reprocessar', 'ignorar'].includes(acao) ||
    !(await equipeSuporte())
  )
    return falha('Acesso indisponível.');
  const { error } = await criarSistemaSuporte()
    .from('suporte_email_recebidos')
    .update({
      estado: acao === 'reprocessar' ? 'pendente' : 'ignorado',
      tentativas: 0,
      motivo: acao === 'ignorar' ? 'Ignorado pela equipe.' : null,
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', id)
    .in('estado', ['falhou', 'revisao']);
  if (error) return falha();
  atualizar();
  return { ok: true };
}
