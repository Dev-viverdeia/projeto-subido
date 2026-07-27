'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Alert, Input } from '@/design-system/via';
import { criarConta, type EstadoAuth } from '@/lib/auth/actions';
import { ROTA_ENTRAR } from '@/lib/routes';
import { BotaoEnviar } from './BotaoEnviar';
import styles from './formulario.module.css';

const INICIAL: EstadoAuth = {};

export function FormularioCriarConta() {
  const [estado, acao] = useActionState(criarConta, INICIAL);

  /**
   * Depois do envio bem-sucedido o formulário SOME e sobra só a confirmação.
   * Mantê-lo na tela convida ao reenvio, e reenviar aqui dispara outro e-mail de
   * confirmação — que é justamente o caminho para o rate limit do Supabase.
   */
  if (estado.sucesso) {
    return (
      <Alert tone="success" title="Confirme seu e-mail">
        {estado.sucesso}
      </Alert>
    );
  }

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
          id="nome"
          name="nome"
          type="text"
          label="Nome"
          autoComplete="name"
          defaultValue={estado.campos?.nome ?? ''}
          error={estado.porCampo?.nome}
          required
        />

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

        <Input
          id="senha"
          name="senha"
          type="password"
          label="Senha"
          autoComplete="new-password"
          hint="Ao menos 8 caracteres."
          error={estado.porCampo?.senha}
          required
        />

        <BotaoEnviar>Criar conta</BotaoEnviar>
      </form>

      <p className={styles.alternativa}>
        Já tem conta? <Link href={ROTA_ENTRAR}>Entrar</Link>
      </p>
    </>
  );
}
