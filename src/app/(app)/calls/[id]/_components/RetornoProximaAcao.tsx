import { BadgeCheck, Check, CircleAlert } from 'lucide-react';
import styles from '../pagina.module.css';

export function RetornoProximaAcao({ estado }: { estado: string | null }) {
  if (estado === 'ok') {
    return (
      <div className={styles.retorno} data-tipo="sucesso" role="status">
        <Check size={17} aria-hidden="true" />
        Próxima ação confirmada. O CRM e a linha do tempo já foram atualizados.
      </div>
    );
  }

  if (estado === 'sem-alteracao') {
    return (
      <div className={styles.retorno} role="status">
        <BadgeCheck size={17} aria-hidden="true" />
        Essa ação já estava salva no CRM; nada foi duplicado.
      </div>
    );
  }

  if (estado === 'erro') {
    return (
      <div className={styles.retorno} data-tipo="erro" role="alert">
        <CircleAlert size={17} aria-hidden="true" />
        Não foi possível salvar agora. Revise o texto e a data antes de tentar novamente.
      </div>
    );
  }

  return null;
}
