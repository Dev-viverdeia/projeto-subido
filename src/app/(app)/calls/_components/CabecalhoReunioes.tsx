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
        <p className={styles.sobretitulo}>Reuniões</p>
        <h1>Reuniões</h1>
        <p>
          {comercialLiberado
            ? 'Crie a sala, use o Live Coach e salve a conversa na ficha do cliente.'
            : 'Crie a sala, envie o convite e use o Live Coach durante a conversa.'}
        </p>
      </div>
      {children}
    </header>
  );
}
