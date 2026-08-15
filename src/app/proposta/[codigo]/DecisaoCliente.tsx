'use client';

import { useActionState } from 'react';
import { Check, X } from 'lucide-react';
import { decidirPropostaCliente, type EstadoDecisaoProposta } from '@/lib/propostas/portal-actions';
import styles from './proposta.module.css';

const INICIAL: EstadoDecisaoProposta = {};

export function DecisaoCliente({
  codigo,
  nomeInicial,
  emailInicial,
}: {
  codigo: string;
  nomeInicial: string;
  emailInicial: string;
}) {
  const [estado, acao, enviando] = useActionState(decidirPropostaCliente, INICIAL);

  if (estado.sucesso) {
    return (
      <div className={styles.decisaoConcluida} data-status={estado.status} role="status">
        <span>
          {estado.status === 'aceita' ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}
        </span>
        <div>
          <p>Decisão registrada</p>
          <h2>{estado.status === 'aceita' ? 'Projeto aprovado.' : 'Retorno enviado.'}</h2>
          <span>{estado.sucesso}</span>
        </div>
      </div>
    );
  }

  return (
    <form action={acao} className={styles.formDecisao}>
      <input type="hidden" name="codigo" value={codigo} />
      <div className={styles.formTopo}>
        <p>05 · Decisão</p>
        <h2>Pronto para avançar?</h2>
        <span>
          Confirme seus dados e registre a decisão. A equipe recebe o retorno imediatamente.
        </span>
      </div>

      <div className={styles.camposDecisao}>
        <label>
          <span>Seu nome</span>
          <input
            name="nome"
            type="text"
            defaultValue={nomeInicial}
            minLength={2}
            maxLength={120}
            autoComplete="name"
            required
          />
        </label>
        <label>
          <span>Seu e-mail</span>
          <input
            name="email"
            type="email"
            defaultValue={emailInicial}
            maxLength={254}
            autoComplete="email"
            required
          />
        </label>
        <label className={styles.comentario}>
          <span>
            Comentário <small>opcional</small>
          </span>
          <textarea
            name="comentario"
            rows={3}
            maxLength={2000}
            placeholder="Inclua uma observação, condição ou motivo da decisão."
          />
        </label>
      </div>

      {estado.erro && (
        <p className={styles.erroDecisao} role="alert">
          {estado.erro}
        </p>
      )}

      <div className={styles.acoesDecisao}>
        <button type="submit" name="decisao" value="aceita" disabled={enviando}>
          <Check size={17} aria-hidden="true" />
          {enviando ? 'Registrando…' : 'Aprovar proposta'}
        </button>
        <button
          type="submit"
          name="decisao"
          value="recusada"
          disabled={enviando}
          className={styles.recusar}
        >
          Não seguir agora
        </button>
      </div>
      <small className={styles.segurancaDecisao}>
        Sua decisão fica vinculada a esta versão da proposta, com data, nome e e-mail.
      </small>
    </form>
  );
}
