import 'server-only';
import { createHash, createHmac } from 'node:crypto';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types.generated';
// Acesso de sistema restrito a tokens públicos, limites e arquivos previamente autorizados pela RLS.
// eslint-disable-next-line no-restricted-imports
import { createAdminClient } from '@/lib/supabase/admin';
import { env, serverEnv } from '@/lib/env';
import { ehAdmin } from '@/lib/auth/papeis';
import {
  ArtigoSchema,
  MENSAGENS_POR_PAGINA,
  type CasoSuporte,
  type MensagemSuporte,
} from './contrato';

export const criarSistemaSuporte = createAdminClient;
export const usuarioSuporte = cache(async () => {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  return user;
});
export const equipeSuporte = cache(async () => {
  const user = await usuarioSuporte();
  if (!user) return false;
  if (await ehAdmin()) return true;
  const db = await createClient();
  const { data, error } = await db
    .from('suporte_agentes')
    .select('usuario')
    .eq('usuario', user.id)
    .maybeSingle();
  return !error && !!data;
});
export async function artigosSuporte(incluirRascunhos = false) {
  const db = await createClient();
  let query = db.from('suporte_artigos').select('*').order('titulo');
  if (!incluirRascunhos) query = query.eq('publicado', true);
  const { data, error } = await query;
  if (error) throw new Error('guias_indisponiveis');
  return (data ?? []).map((a) => ArtigoSchema.parse(a));
}
export async function listarAtendimentos({
  equipe = false,
  pagina = 0,
  status = '',
  busca = '',
  responsavel = '',
}: {
  equipe?: boolean;
  pagina?: number;
  status?: string;
  busca?: string;
  responsavel?: string;
} = {}) {
  const user = await usuarioSuporte();
  if (!user || (equipe && !(await equipeSuporte()))) throw new Error('acesso_negado');
  const db = await createClient();
  let query = db
    .from('suporte_atendimentos')
    .select('*', { count: 'exact' })
    .eq('verificado', true);
  if (!equipe) query = query.eq('dono', user.id);
  if (status === 'pendentes') query = query.in('status', ['recebido', 'em_atendimento']);
  else if (status) query = query.eq('status', status);
  if (busca) {
    const termo = busca.trim().slice(0, 120);
    query = /^#?\d{1,12}$/.test(termo)
      ? query.eq('numero', Number(termo.replace('#', '')))
      : query.ilike('assunto', `%${termo.replace(/[\\%_]/g, '\\$&')}%`);
  }
  if (equipe && responsavel === 'meus') query = query.eq('responsavel', user.id);
  if (equipe && responsavel === 'sem') query = query.is('responsavel', null);
  if (equipe && status === 'pendentes')
    query = query
      .order('prioridade')
      .order('aguardando_equipe_desde', { ascending: true, nullsFirst: false });
  const { data, error, count } = await query
    .order('atualizado_em', { ascending: equipe && status === 'pendentes' })
    .range(pagina * 30, pagina * 30 + 29);
  if (error) throw new Error('atendimentos_indisponiveis');
  return { casos: (data ?? []).map((a) => casoSeguro(a, equipe)), total: count ?? 0 };
}
type LinhaCaso = Database['public']['Tables']['suporte_atendimentos']['Row'];
export function casoSeguro(a: LinhaCaso, equipe = false): CasoSuporte {
  return {
    id: a.id,
    numero: a.numero,
    assunto: a.assunto,
    categoria: a.categoria as CasoSuporte['categoria'],
    status: a.status as CasoSuporte['status'],
    prioridade: a.prioridade as CasoSuporte['prioridade'],
    responsavel: a.responsavel,
    criado_em: a.criado_em,
    atualizado_em: a.atualizado_em,
    pagina: a.pagina,
    avaliacao: a.avaliacao,
    lido_usuario_em: a.lido_usuario_em,
    lido_equipe_em: a.lido_equipe_em,
    ultima_resposta_equipe_em: a.ultima_resposta_equipe_em,
    ultima_mensagem_cliente_em: a.ultima_mensagem_cliente_em,
    ultima_mensagem_resumo: a.ultima_mensagem_resumo,
    aguardando_equipe_desde: a.aguardando_equipe_desde,
    ...(equipe ? { email: a.email } : {}),
  };
}
export async function detalheAtendimento(id: string, equipe = false, pagina = 0) {
  const user = await usuarioSuporte();
  if (!user || (equipe && !(await equipeSuporte()))) return null;
  const db = await createClient();
  let query = db.from('suporte_atendimentos').select('*').eq('id', id);
  if (!equipe) query = query.eq('dono', user.id);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error('atendimento_indisponivel');
  if (!data) return null;
  let mensagensQuery = db
    .from('suporte_mensagens')
    .select('*, suporte_arquivos(id,nome,bytes,mime)', { count: 'exact' })
    .eq('atendimento', id);
  if (!equipe) mensagensQuery = mensagensQuery.eq('interna', false);
  const {
    data: mensagens,
    error: erroMensagens,
    count,
  } = await mensagensQuery
    .order('criado_em', { ascending: false })
    .order('id', { ascending: false })
    .range(pagina * MENSAGENS_POR_PAGINA, (pagina + 1) * MENSAGENS_POR_PAGINA - 1);
  if (erroMensagens) throw new Error('mensagens_indisponiveis');
  return {
    caso: casoSeguro(data, equipe),
    pagina,
    totalMensagens: count ?? 0,
    mensagens: (mensagens ?? []).reverse().map((m): MensagemSuporte => ({
      id: m.id,
      texto: m.texto,
      papel: m.papel as MensagemSuporte['papel'],
      interna: m.interna,
      criado_em: m.criado_em,
      arquivos: m.suporte_arquivos,
      nome_autor: m.nome_autor,
      canal: m.canal as 'plataforma' | 'email',
    })),
  };
}
export function hashAcesso(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
export function cookieSuporte(id: string) {
  return `subido-suporte-${id}`;
}
export async function acessoPublico(id: string) {
  const token = (await cookies()).get(cookieSuporte(id))?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const db = criarSistemaSuporte();
  const { data, error } = await db
    .from('suporte_atendimentos')
    .select('*')
    .eq('id', id)
    .is('dono', null)
    .eq('verificado', true)
    .eq('acesso_hash', hashAcesso(token))
    .gt('acesso_expira_em', new Date().toISOString())
    .maybeSingle();
  return !error && data ? { caso: data, hash: hashAcesso(token) } : null;
}
export function mesmaOrigem(request: Request) {
  const origem = request.headers.get('origin');
  return (
    !!origem &&
    (origem === new URL(env.NEXT_PUBLIC_SITE_URL).origin || origem === new URL(request.url).origin)
  );
}
export async function limitarSuporte(
  identidade: string,
  acao: string,
  limite: number,
  segundos: number,
  signal?: AbortSignal,
) {
  const chave = createHmac('sha256', serverEnv().SUPABASE_SECRET_KEY)
    .update(`${acao}:${identidade}`)
    .digest('hex');
  const { data, error } = await criarSistemaSuporte(signal ? { signal } : undefined).rpc(
    'suporte_limitar',
    {
      p_chave: chave,
      p_limite: limite,
      p_segundos: segundos,
    },
  );
  return !error && data === true;
}
export function ipSuporte(request: Request) {
  return (
    request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'local'
  );
}
