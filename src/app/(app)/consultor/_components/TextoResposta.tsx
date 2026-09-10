import { ChevronDown } from 'lucide-react';
import { blocosDaResposta, leituraDaResposta } from './resposta';
import styles from './LeituraResposta.module.css';

/** Texto puro e details nativo: funciona sem JS e nunca interpreta HTML da IA. */
export function TextoResposta({ texto, completa = false }: { texto: string; completa?: boolean }) {
  const { abertura, restante } = completa
    ? { abertura: blocosDaResposta(texto), restante: [] }
    : leituraDaResposta(texto);
  return (
    <div className={styles.resposta} data-texto-resposta>
      <div className={styles.prosa}>
        {abertura.map((bloco, i) => (
          <p key={i}>{bloco}</p>
        ))}
      </div>
      {restante.length > 0 ? (
        <details className={styles.continuacao}>
          <summary>
            <span className={styles.quandoFechado}>Ler resposta completa</span>
            <span className={styles.quandoAberto}>Recolher resposta</span>
            <ChevronDown size={16} aria-hidden="true" />
          </summary>
          <div className={styles.prosa}>
            {restante.map((bloco, i) => (
              <p key={i}>{bloco}</p>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
