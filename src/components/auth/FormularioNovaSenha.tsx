'use client';

import { useActionState } from 'react';
import { Alert, Input } from '@/design-system/via';
import { definirNovaSenha, type EstadoAuth } from '@/lib/auth/actions';
import { BotaoEnviar } from './BotaoEnviar';
import styles from './formulario.module.css';

const INICIAL: EstadoAuth = {};

export function FormularioNovaSenha() {
  const [estado, acao] = useActionState(definirNovaSenha, INICIAL);

  return (
    <>
      {estado.erro && (
        <div className={styles.aviso}>
          <Alert tone="danger" size="compact">
            {estado.erro}
          </Alert>
        </div>
      )}

      <form action={acao} className={styles.campos} noValidate>
        <Input
          id="senha"
          name="senha"
          type="password"
          label="Nova senha"
          autoComplete="new-password"
          hint="Ao menos 8 caracteres."
          error={estado.porCampo?.senha}
          required
        />

        <Input
          id="confirmacao"
          name="confirmacao"
          type="password"
          label="Repita a nova senha"
          autoComplete="new-password"
          error={estado.porCampo?.confirmacao}
          required
        />

        <BotaoEnviar>Salvar senha</BotaoEnviar>
      </form>
    </>
  );
}
