'use client';

import { Spinner } from '@/design-system/via';
import type { StatusProposta } from '@/lib/propostas/queries';
import { PROXIMA_ACAO_STATUS, ROTULO_ACAO_STATUS } from '@/lib/propostas/status';
import styles from './EditorProposta.module.css';

export function AcoesStatusProposta({
  id,
  versao,
  status,
  acao,
  bloqueado,
  pendente,
}: {
  id: string;
  versao: number;
  status: StatusProposta;
  acao: (dados: FormData) => void;
  bloqueado: boolean;
  pendente: boolean;
}) {
  const proximoStatus = PROXIMA_ACAO_STATUS[status];
  return (
    <form action={acao} className={styles.acoesStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="versao" value={versao} />
      {proximoStatus && (
        <button
          type="submit"
          name="status"
          value={proximoStatus}
          disabled={bloqueado || pendente}
          className={styles.avancar}
        >
          {pendente ? 'Atualizando…' : ROTULO_ACAO_STATUS[status]}
        </button>
      )}
      {status === 'apresentada' && (
        <>
          <p className={styles.automacaoEntrega}>
            Resposta recebida por WhatsApp, e-mail ou reunião.
          </p>
          <button
            type="submit"
            name="status"
            value="aceita"
            disabled={bloqueado || pendente}
            className={styles.avancar}
          >
            Confirmar venda e abrir entrega
          </button>
          <button
            type="submit"
            name="status"
            value="recusada"
            disabled={bloqueado || pendente}
            className={styles.secundario}
          >
            Registrar como não aprovada
          </button>
        </>
      )}
      {(status === 'aceita' || status === 'recusada') && (
        <button
          type="submit"
          name="status"
          value="rascunho"
          disabled={bloqueado || pendente}
          className={styles.secundario}
        >
          Criar nova versão
        </button>
      )}
      {pendente && (
        <span className={styles.atualizandoStatus} role="status">
          <Spinner size="sm" /> Atualizando proposta…
        </span>
      )}
      {bloqueado && !proximoStatus && (
        <p className={styles.automacaoEntrega}>Salve as alterações antes de continuar.</p>
      )}
    </form>
  );
}
