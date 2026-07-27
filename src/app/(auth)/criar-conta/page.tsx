import type { Metadata } from 'next';
import { Cabecalho } from '@/components/auth/Cabecalho';
import { FormularioCriarConta } from '@/components/auth/FormularioCriarConta';
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

      {/* TODO(legal): apontar para as páginas reais quando existirem — hoje os
          documentos não estão publicados e um link quebrado aqui é pior que texto. */}
      <p className={styles.legal}>
        Ao criar a conta você concorda com os termos de uso e com a política de privacidade.
      </p>
    </>
  );
}
