import { ListFilter } from 'lucide-react';
import styles from '../pagina.module.css';

export function ListasVazias() {
  return (
    <div className={styles.listasVazias}>
      <ListFilter size={20} aria-hidden="true" />
      <p>Suas listas aparecerão aqui.</p>
    </div>
  );
}
