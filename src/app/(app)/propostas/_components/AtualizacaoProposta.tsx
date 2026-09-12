'use client';

import { X } from 'lucide-react';
import type { useAcompanhamentoProposta } from './useAcompanhamentoProposta';
import styles from './CompartilharProposta.module.css';

export function AtualizacaoProposta({
  acompanhamento,
}: {
  acompanhamento: ReturnType<typeof useAcompanhamentoProposta>;
}) {
  const { falha, aviso, consultando, tentarNovamente, dispensarAviso } = acompanhamento;
  const mensagem =
    falha === 'offline'
      ? 'Sem conexão. O acompanhamento volta quando a internet voltar.'
      : falha === 'sessao'
        ? 'Entre novamente para atualizar. Sua edição continua aqui.'
        : falha === 'acesso'
          ? 'O acesso à proposta mudou. Sua edição continua aqui.'
          : falha === 'temporaria'
            ? 'Não foi possível atualizar. Exibindo a última informação.'
            : aviso;

  return (
    <div
      className={styles.atualizacao}
      data-visivel={Boolean(mensagem) || undefined}
      data-falha={Boolean(falha) || undefined}
    >
      <span role={mensagem ? 'status' : undefined} aria-live="polite" aria-atomic="true">
        {mensagem}
      </span>
      {falha === 'sessao' && (
        <a href="/entrar" target="_blank" rel="noreferrer">
          Entrar em outra aba
        </a>
      )}
      {falha && falha !== 'offline' && (
        <button type="button" onClick={tentarNovamente} disabled={consultando}>
          {consultando ? 'Atualizando…' : 'Tentar novamente'}
        </button>
      )}
      {!falha && aviso && (
        <button type="button" onClick={dispensarAviso} aria-label="Dispensar aviso de atualização">
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
