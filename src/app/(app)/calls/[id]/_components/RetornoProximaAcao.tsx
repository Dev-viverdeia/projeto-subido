import { BadgeCheck, Check, CircleAlert } from 'lucide-react';
import styles from '../pagina.module.css';

export function RetornoProximaAcao({ estado }: { estado: string | null }) {
  if (estado === 'ok') {
    return (
      <div className={styles.retorno} data-tipo="sucesso" role="status">
        <Check size={17} aria-hidden="true" />
        Plano aplicado. CRM, pipeline e compromissos já refletem o que foi confirmado.
      </div>
    );
  }

  if (estado === 'sem-alteracao') {
    return (
      <div className={styles.retorno} role="status">
        <BadgeCheck size={17} aria-hidden="true" />
        Este plano já estava sincronizado; nada foi duplicado.
      </div>
    );
  }

  if (estado === 'erro') {
    return (
      <div className={styles.retorno} data-tipo="erro" role="alert">
        <CircleAlert size={17} aria-hidden="true" />
        Não foi possível aplicar o plano agora. Revise os campos antes de tentar novamente.
      </div>
    );
  }

  return null;
}
