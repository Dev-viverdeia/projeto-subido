import type { ReactNode } from 'react';
import { MolduraAuth } from '@/components/auth/MolduraAuth';

/**
 * Grupo de uma rota só: `/nova-senha`.
 *
 * Existe porque esta é a única tela de sessão em que TER sessão é pré-requisito, e
 * não motivo para ser mandado embora. Quem chega aqui veio do link do e-mail, que
 * passou pelo `/auth/callback` e já trocou o token por uma sessão — o redirect de
 * `(auth)` mataria exatamente esse fluxo.
 *
 * Sem checagem própria de propósito: a autorização real acontece no
 * `updateUser({ password })` da Server Action, que falha sem sessão. Repetir a
 * checagem aqui só adicionaria um caminho a manter.
 */
export default function RecuperacaoLayout({ children }: { children: ReactNode }) {
  return <MolduraAuth>{children}</MolduraAuth>;
}
