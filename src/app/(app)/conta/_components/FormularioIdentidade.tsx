'use client';

import { useActionState, useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { atualizarIdentidade, type EstadoIdentidade } from '@/lib/auth/actions';
import styles from './FormularioIdentidade.module.css';

const ESTADO_INICIAL: EstadoIdentidade = {};

/**
 * Edição pequena, mas global: o nome salvo reaparece no cabeçalho, na conta e
 * nas superfícies que identificam o profissional. O valor fica controlado para
 * que o botão só prometa uma gravação quando existe uma mudança real.
 */
export function FormularioIdentidade({ nome }: { nome: string }) {
  const [estado, acao, pendente] = useActionState(atualizarIdentidade, ESTADO_INICIAL);
  const [valor, setValor] = useState(nome);
  const nomeSalvo = estado.nome ?? nome;
  const alterado = valor.trim() !== nomeSalvo.trim();

  return (
    <form action={acao} className={styles.formulario}>
      <div className={styles.campo}>
        <label htmlFor="nome-profissional">Nome profissional</label>
        <input
          id="nome-profissional"
          type="text"
          name="nome"
          value={valor}
          minLength={2}
          maxLength={80}
          autoComplete="name"
          required
          aria-invalid={Boolean(estado.porCampo?.nome)}
          aria-describedby="ajuda-nome-profissional mensagem-identidade"
          onChange={(evento) => setValor(evento.target.value)}
        />
        <small id="ajuda-nome-profissional">
          É assim que você aparece no cabeçalho, certificados e entregas.
        </small>
        {estado.porCampo?.nome && <em role="alert">{estado.porCampo.nome}</em>}
      </div>

      <div className={styles.rodape}>
        <p
          id="mensagem-identidade"
          className={estado.erro ? styles.erro : estado.sucesso ? styles.sucesso : undefined}
          aria-live="polite"
        >
          {estado.erro ??
            estado.sucesso ??
            (alterado ? 'Salve para aplicar a alteração.' : 'Nenhuma alteração pendente.')}
        </p>

        <div className={styles.acoes}>
          <button
            type="button"
            className={styles.descartar}
            disabled={!alterado || pendente}
            onClick={() => setValor(nomeSalvo)}
          >
            <RotateCcw size={15} strokeWidth={1.9} aria-hidden="true" />
            Descartar
          </button>
          <button type="submit" className={styles.salvar} disabled={!alterado || pendente}>
            <Check size={16} strokeWidth={2.2} aria-hidden="true" />
            {pendente ? 'Salvando…' : 'Salvar nome'}
          </button>
        </div>
      </div>
    </form>
  );
}
