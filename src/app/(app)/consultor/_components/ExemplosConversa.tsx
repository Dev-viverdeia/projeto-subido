import { ArrowRight } from 'lucide-react';
import type { ExemploDoConsultor } from './Conversa';
import styles from './Conversa.module.css';

export function ExemplosConversa({
  exemplos,
  ocupado,
  escolher,
}: {
  exemplos: ExemploDoConsultor[];
  ocupado: boolean;
  escolher: (texto: string) => void;
}) {
  return (
    <ul className={styles.chips} aria-label="Exemplos de perguntas">
      {exemplos.map((exemplo) => (
        <li key={exemplo.rotulo}>
          <button type="button" disabled={ocupado} onClick={() => escolher(exemplo.texto)}>
            <span className={styles.chipTexto}>
              <strong>{exemplo.rotulo}</strong>
            </span>
            <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}
