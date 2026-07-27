import type { Metadata } from 'next';
import { Cabecalho } from '@/components/auth/Cabecalho';
import { FormularioNovaSenha } from '@/components/auth/FormularioNovaSenha';

export const metadata: Metadata = {
  title: 'Nova senha',
  robots: { index: false, follow: false },
};

/**
 * Chegada do link de redefinição.
 *
 * O `/auth/callback` já trocou o token do e-mail por uma sessão antes de mandar para
 * cá, então o `updateUser({ password })` da action tem quem autenticar.
 *
 * Mora no grupo `(recuperacao)` e não em `(auth)` porque a regra de acesso é
 * invertida: aqui TER sessão é pré-requisito, lá é motivo de redirect. Ver o
 * comentário em MolduraAuth. Quem abrir esta URL na mão, sem sessão, vê o formulário
 * e recebe o erro da action ao enviar — a autorização real está lá, não numa
 * checagem de layout.
 */
export default function NovaSenhaPage() {
  return (
    <>
      <Cabecalho titulo="Definir nova senha">
        Escolha uma senha que você não use em outro lugar.
      </Cabecalho>
      <FormularioNovaSenha />
    </>
  );
}
