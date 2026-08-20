'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ROTA_ENTRAR } from '@/lib/routes';
import type { EstadoIntroducao } from './estado';

/**
 * Registra a passagem pela introdução no usuário autenticado.
 *
 * Não existe tabela nem consulta extra no shell: o Supabase assina o metadado no
 * JWT renovado e o layout consegue lê-lo localmente nas próximas navegações.
 */
export async function concluirIntroducao(_estado: EstadoIntroducao): Promise<EstadoIntroducao> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data) redirect(ROTA_ENTRAR);

  const { error } = await supabase.auth.updateUser({
    data: { introducao_subido_concluida_em: new Date().toISOString() },
  });

  if (error) {
    return {
      erro: 'Não conseguimos liberar seu acesso agora. Tente novamente em instantes.',
    };
  }

  /* Garante que o novo metadado já esteja no token usado pelo redirect. */
  const { error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError) {
    return {
      erro: 'Seu acesso foi salvo, mas a sessão não atualizou. Recarregue a página para entrar.',
    };
  }

  redirect('/inicio');
}
