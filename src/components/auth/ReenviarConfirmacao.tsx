'use client';

import { useActionState } from 'react';
import { Alert } from '@/design-system/via';
import { reenviarConfirmacao, type EstadoAuth } from '@/lib/auth/actions';
import { BotaoEnviar } from './BotaoEnviar';
import styles from './formulario.module.css';

export function ReenviarConfirmacao({
  email,
  compacto = false,
}: {
  email: string;
  compacto?: boolean;
}) {
  const inicial: EstadoAuth = { emailPendente: email, confirmacaoPendente: true };
  const [estado, acao] = useActionState(reenviarConfirmacao, inicial);

  return (
    <div className={compacto ? styles.reenvioCompacto : styles.reenvio}>
      {estado.sucesso && (
        <Alert tone="success" size="compact" title="Novo link solicitado">
          {estado.sucesso}
        </Alert>
      )}
      <form action={acao}>
        <input type="hidden" name="email" value={email} />
        <BotaoEnviar variant="secondary">Reenviar confirmação</BotaoEnviar>
      </form>
    </div>
  );
}
