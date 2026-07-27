'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Alert, Input } from '@/design-system/via';
import { entrar, type EstadoAuth } from '@/lib/auth/actions';
import { ROTA_CRIAR_CONTA, ROTA_RECUPERAR_SENHA } from '@/lib/routes';
import { BotaoEnviar } from './BotaoEnviar';
import styles from './formulario.module.css';

const INICIAL: EstadoAuth = {};

export function FormularioEntrar({
  proximo,
  linkInvalido,
}: {
  proximo: string;
  linkInvalido: boolean;
}) {
  const [estado, acao] = useActionState(entrar, INICIAL);

  return (
    <>
      {linkInvalido && (
        <div className={styles.aviso}>
          <Alert tone="attn" size="compact" title="Link expirado">
            Esse link já foi usado ou passou da validade. Entre com sua senha, ou peça um link novo.
          </Alert>
        </div>
      )}

      {estado.erro && (
        <div className={styles.aviso}>
          <Alert tone="danger" size="compact">
            {estado.erro}
          </Alert>
        </div>
      )}

      <form action={acao} className={styles.campos} noValidate>
        {/* O destino atravessa o POST por campo oculto. Guardá-lo na querystring da
            action perderia o valor no re-render que segue um erro de validação. */}
        <input type="hidden" name="proximo" value={proximo} />

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

        <div>
          <Input
            id="senha"
            name="senha"
            type="password"
            label="Senha"
            autoComplete="current-password"
            error={estado.porCampo?.senha}
            required
          />
          {/* Abaixo do campo, alinhado à direita: acima colidiria com o rótulo que o
              Input do DS renderiza por conta própria. */}
          <div className={styles.linhaAtalho}>
            <Link href={ROTA_RECUPERAR_SENHA} className={styles.atalho}>
              Esqueci minha senha
            </Link>
          </div>
        </div>

        <BotaoEnviar>Entrar</BotaoEnviar>
      </form>

      <p className={styles.alternativa}>
        Ainda não tem conta? <Link href={ROTA_CRIAR_CONTA}>Criar conta</Link>
      </p>
    </>
  );
}
