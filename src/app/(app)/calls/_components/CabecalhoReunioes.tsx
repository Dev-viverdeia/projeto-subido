import type { ReactNode } from 'react';
import styles from '../pagina.module.css';

export function CabecalhoReunioes({
  comercialLiberado,
  children,
}: {
  comercialLiberado: boolean;
  children: ReactNode;
}) {
  return (
    <header className={styles.topo}>
      <div className={styles.introducao}>
        <h1>Reuniões</h1>
        <p>
          {comercialLiberado
            ? 'Prepare a conversa, conduza a decisão e registre o próximo passo.'
            : 'Prepare e conduza cada conversa com clareza.'}
        </p>
      </div>
      {children}
    </header>
  );
}
