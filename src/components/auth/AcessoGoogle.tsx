'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/design-system/via';
import { entrarComGoogle } from '@/lib/auth/actions';
import styles from './formulario.module.css';

function MarcaGoogle() {
  return <span className={styles.marcaGoogle}>G</span>;
}

function BotaoGoogle({ rotulo }: { rotulo: string }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="secondary"
      size="lg"
      fullWidth
      loading={pending}
      iconLeft={<MarcaGoogle />}
    >
      {pending ? 'Abrindo o Google' : rotulo}
    </Button>
  );
}

export function AcessoGoogle({
  proximo,
  rotulo = 'Continuar com Google',
}: {
  proximo: string;
  rotulo?: string;
}) {
  return (
    <>
      <form action={entrarComGoogle}>
        <input type="hidden" name="proximo" value={proximo} />
        <BotaoGoogle rotulo={rotulo} />
      </form>
      <div className={styles.separador} aria-hidden="true">
        <span>ou use seu e-mail</span>
      </div>
    </>
  );
}
