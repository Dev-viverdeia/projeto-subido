import { ArrowRight, Check, CircleAlert, Clock3, MessageSquareMore } from 'lucide-react';
import type { EstadoJornadaEntrega } from '@/lib/projetos-execucao/jornada-entrega';
import styles from './JornadaEntrega.module.css';

export function JornadaEntrega({
  estado,
  onAbrir,
}: {
  estado: EstadoJornadaEntrega;
  onAbrir: () => void;
}) {
  return (
    <section className={styles.card} data-tom={estado.tom} aria-labelledby="jornada-titulo">
      <span className={styles.icone} aria-hidden="true">
        {estado.tom === 'concluido' ? (
          <Check size={17} />
        ) : estado.tom === 'ajuste' ? (
          <MessageSquareMore size={17} />
        ) : estado.tom === 'atrasado' ? (
          <CircleAlert size={17} />
        ) : estado.tom === 'aguardando' ? (
          <Clock3 size={17} />
        ) : (
          <ArrowRight size={17} />
        )}
      </span>
      <div className={styles.conteudo}>
        <p>Antes de continuar</p>
        <strong className={styles.titulo} id="jornada-titulo">
          {estado.titulo}
        </strong>
        <span className={styles.descricao}>{estado.descricao}</span>
      </div>

      <button type="button" onClick={onAbrir} aria-label={estado.nomeAcessivelAcao}>
        {estado.rotuloAcao}
        <ArrowRight size={15} aria-hidden="true" />
      </button>
    </section>
  );
}
