'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Alert, Input } from '@/design-system/via';
import { criarConta, type EstadoAuth } from '@/lib/auth/actions';
import { ROTA_BOAS_VINDAS, ROTA_ENTRAR, ROTA_RECUPERAR_SENHA } from '@/lib/routes';
import { AcessoGoogle } from './AcessoGoogle';
import { BotaoEnviar } from './BotaoEnviar';
import { ReenviarConfirmacao } from './ReenviarConfirmacao';
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
      <div className={styles.confirmacao}>
        <Alert tone="success" title="Confira seu e-mail">
          {estado.sucesso}
        </Alert>
        <p>Se você já usou este endereço na Subido, entre com sua senha ou peça uma nova.</p>
        {estado.emailPendente && <ReenviarConfirmacao email={estado.emailPendente} />}
        <div className={styles.acoesConfirmacao}>
          <Link href={ROTA_ENTRAR}>Entrar</Link>
          <Link href={ROTA_RECUPERAR_SENHA}>Esqueci minha senha</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <AcessoGoogle proximo={ROTA_BOAS_VINDAS} rotulo="Criar conta com Google" />

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
