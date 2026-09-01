import type { ReactNode } from 'react';
import { Check, CircleAlert, Info, LoaderCircle } from 'lucide-react';
import styles from './RetornoOperacao.module.css';

export type TomRetornoOperacao = 'neutro' | 'sucesso' | 'erro' | 'processando';

const ICONES = {
  neutro: <Info size={18} strokeWidth={1.8} />,
  sucesso: <Check size={18} strokeWidth={2} />,
  erro: <CircleAlert size={18} strokeWidth={1.8} />,
  processando: <LoaderCircle size={18} strokeWidth={1.8} />,
} satisfies Record<TomRetornoOperacao, ReactNode>;

/**
 * Feedback compacto para o resultado de uma ação dentro da tela atual.
 *
 * Loading de rota preserva a anatomia com skeleton; operações longas usam
 * `EsperaOperacao`. Este componente cobre o intervalo restante: confirmar o que
 * aconteceu, explicar uma falha ou indicar que uma atualização curta continua.
 */
export function RetornoOperacao({
  tom = 'neutro',
  titulo,
  descricao,
  acao,
}: {
  tom?: TomRetornoOperacao;
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}) {
  const processando = tom === 'processando';

  return (
    <section
      className={styles.retorno}
      data-tom={tom}
      role={tom === 'erro' ? 'alert' : 'status'}
      aria-atomic="true"
      aria-busy={processando || undefined}
    >
      <span className={styles.icone} aria-hidden="true">
        {ICONES[tom]}
      </span>
      <span className={styles.texto}>
        <strong>{titulo}</strong>
        {descricao ? <span>{descricao}</span> : null}
      </span>
      {acao ? <span className={styles.acao}>{acao}</span> : null}
      {processando ? (
        <span className={styles.trilho} aria-hidden="true">
          <span />
        </span>
      ) : null}
    </section>
  );
}
