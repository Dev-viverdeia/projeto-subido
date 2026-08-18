import type { ReactNode } from 'react';
import styles from './EstadoSistema.module.css';

export function EstadoSistema({
  etiqueta,
  titulo,
  descricao,
  icone,
  acoes,
  passos,
  urgente = false,
}: {
  etiqueta: string;
  titulo: string;
  descricao: string;
  icone: ReactNode;
  acoes: ReactNode;
  passos: Array<{ rotulo: string; valor: string }>;
  urgente?: boolean;
}) {
  return (
    <section
      className={styles.estado}
      role={urgente ? 'alert' : 'status'}
      aria-labelledby="estado-sistema-titulo"
    >
      <div className={styles.conteudo}>
        <p className={styles.etiqueta}>{etiqueta}</p>
        <h1 id="estado-sistema-titulo">{titulo}</h1>
        <p className={styles.descricao}>{descricao}</p>
        <div className={styles.acoes}>{acoes}</div>

        <dl className={styles.passos}>
          {passos.map((passo, indice) => (
            <div key={passo.rotulo}>
              <dt>
                <span>{String(indice + 1).padStart(2, '0')}</span>
                {passo.rotulo}
              </dt>
              <dd>{passo.valor}</dd>
            </div>
          ))}
        </dl>
      </div>

      <aside className={styles.sinal} data-on-dark aria-hidden="true">
        <span className={styles.icone}>{icone}</span>
        <span className={styles.linha} />
        <p>Subido</p>
        <strong>Veja o que fazer agora.</strong>
      </aside>
    </section>
  );
}
