import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types.generated';

export type Papel = Database['public']['Enums']['papel_usuario'];

/**
 * Papéis do usuário da requisição.
 *
 * POR QUE UMA CONSULTA E NÃO UM CLAIM DO JWT
 * O caminho mais rápido seria um Custom Access Token Hook do Supabase escrevendo o
 * papel dentro do token — zero consulta por navegação. Mas o token só é reemitido
 * na renovação, então revogar um admin levaria até uma hora para valer. Enquanto a
 * área administrativa tiver punhado de gente, uma consulta indexada por navegação
 * é mais barata que uma janela de uma hora com privilégio revogado ainda ativo.
 *
 * A RLS de `user_roles` já limita a leitura ao próprio usuário — esta função não
 * consegue ler o papel de outra pessoa mesmo que tente.
 */
export async function papeisDoUsuario(): Promise<Papel[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('user_roles').select('papel');

  if (error) {
    /* Falhar FECHADO: erro de consulta vira "sem papel nenhum", nunca "deixa
       passar". Um catch que devolvesse `['admin']` por engano abriria a área
       administrativa numa instabilidade de banco. */
    console.error('[auth:papeis]', error.code, error.message);
    return [];
  }

  return data.map((linha) => linha.papel);
}

/** Atalho para o guard das rotas de `/admin`. */
export async function ehAdmin(): Promise<boolean> {
  return (await papeisDoUsuario()).includes('admin');
}
