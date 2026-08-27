import Link from 'next/link';
import { ArrowRight, BadgeCheck, Check, CircleAlert } from 'lucide-react';
import styles from '../pagina.module.css';

export function RetornoProximaAcao({
  estado,
  oportunidadeId,
}: {
  estado: string | null;
  oportunidadeId: string;
}) {
  if (estado === 'ok') {
    return (
      <div className={styles.retorno} data-tipo="sucesso" role="status">
        <Check size={17} aria-hidden="true" />
        <span>
          Plano aplicado. A ficha, a etapa da venda e os compromissos já refletem o que foi
          confirmado.
        </span>
        <Link href={`/vendas/${oportunidadeId}`}>
          Abrir ficha <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    );
  }

  if (estado === 'sem-alteracao') {
    return (
      <div className={styles.retorno} role="status">
        <BadgeCheck size={17} aria-hidden="true" />
        <span>Este plano já estava sincronizado; nada foi duplicado.</span>
        <Link href={`/vendas/${oportunidadeId}`}>
          Abrir ficha <ArrowRight size={14} aria-hidden="true" />
        </Link>
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
