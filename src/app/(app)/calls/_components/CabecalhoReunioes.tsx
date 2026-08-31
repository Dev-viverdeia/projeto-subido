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
            ? 'Agende, conduza e registre cada conversa.'
            : 'Agende e conduza suas conversas.'}
        </p>
      </div>
      {children}
    </header>
  );
}
