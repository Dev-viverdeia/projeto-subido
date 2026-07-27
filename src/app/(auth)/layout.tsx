import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { MolduraAuth } from '@/components/auth/MolduraAuth';
import { createClient } from '@/lib/supabase/server';
import { ROTA_POS_LOGIN } from '@/lib/routes';

/**
 * Grupo das telas de entrada — entrar, criar-conta, recuperar-senha.
 *
 * QUEM JÁ TEM SESSÃO NÃO VÊ ESTAS TELAS, e a checagem mora aqui e não no proxy de
 * propósito: incluir `/entrar` no matcher criaria o loop óbvio — o proxy manda o
 * deslogado para `/entrar`, que dispara o proxy de novo.
 *
 * `/nova-senha` NÃO está neste grupo. Ela é o oposto: só se chega lá com sessão.
 * Ver o comentário em MolduraAuth.
 *
 * Ler a sessão torna estas rotas dinâmicas, e tudo bem — a regra do shell estático
 * vale para `(marketing)`, que é quem recebe o tráfego pago.
 */
export default async function AuthLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data) redirect(ROTA_POS_LOGIN);

  return <MolduraAuth>{children}</MolduraAuth>;
}
