import type { Metadata } from 'next';
import { Cabecalho } from '@/components/auth/Cabecalho';
import { FormularioCriarConta } from '@/components/auth/FormularioCriarConta';
import Link from 'next/link';
import styles from '@/components/auth/formulario.module.css';

export const metadata: Metadata = {
  title: 'Criar conta',
  robots: { index: false, follow: false },
};

export default function CriarContaPage() {
  return (
    <>
      <Cabecalho titulo="Criar conta">
        Leva menos de um minuto. Você confirma o e-mail e já entra.
      </Cabecalho>

      <FormularioCriarConta />

      <p className={styles.legal}>
        Ao criar a conta você concorda com os <Link href="/termos">termos de uso</Link> e com a{' '}
        <Link href="/privacidade">política de privacidade</Link>.
      </p>
    </>
  );
}
