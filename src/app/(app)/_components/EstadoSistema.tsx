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
      data-urgente={urgente || undefined}
      role={urgente ? 'alert' : 'status'}
      aria-labelledby="estado-sistema-titulo"
    >
      <header className={styles.cabecalho}>
        <div className={styles.meta}>
          <span className={styles.icone} aria-hidden="true">
            {icone}
          </span>
          <p className={styles.etiqueta}>{etiqueta}</p>
          <span className={styles.marca}>Subido</span>
        </div>
        <h1 id="estado-sistema-titulo">{titulo}</h1>
        <p className={styles.descricao}>{descricao}</p>
      </header>

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
    </section>
  );
}
