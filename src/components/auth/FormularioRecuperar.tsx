'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Alert, Input } from '@/design-system/via';
import { recuperarSenha, type EstadoAuth } from '@/lib/auth/actions';
import { ROTA_ENTRAR } from '@/lib/routes';
import { BotaoEnviar } from './BotaoEnviar';
import styles from './formulario.module.css';

const INICIAL: EstadoAuth = {};

export function FormularioRecuperar() {
  const [estado, acao] = useActionState(recuperarSenha, INICIAL);

  if (estado.sucesso) {
    return (
      <>
        <Alert tone="success" title="Link enviado">
          {estado.sucesso}
        </Alert>
        <p className={styles.alternativa}>
          <Link href={ROTA_ENTRAR}>Voltar para entrar</Link>
        </p>
      </>
    );
  }

  return (
    <>
      <form action={acao} className={styles.campos} noValidate>
        <Input
          id="email"
          name="email"
          type="email"
          label="E-mail"
          autoComplete="email"
          defaultValue={estado.campos?.email ?? ''}
          error={estado.porCampo?.email}
          required
        />

        <BotaoEnviar>Enviar link</BotaoEnviar>
      </form>

      <p className={styles.alternativa}>
        Lembrou a senha? <Link href={ROTA_ENTRAR}>Entrar</Link>
      </p>
    </>
  );
}
