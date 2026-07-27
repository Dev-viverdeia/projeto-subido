import type { Metadata } from 'next';
import { Cabecalho } from '@/components/auth/Cabecalho';
import { FormularioRecuperar } from '@/components/auth/FormularioRecuperar';

export const metadata: Metadata = {
  title: 'Recuperar senha',
  robots: { index: false, follow: false },
};

export default function RecuperarSenhaPage() {
  return (
    <>
      <Cabecalho titulo="Recuperar senha">
        Digite o e-mail da sua conta e enviamos um link para você definir uma senha nova.
      </Cabecalho>
      <FormularioRecuperar />
    </>
  );
}
