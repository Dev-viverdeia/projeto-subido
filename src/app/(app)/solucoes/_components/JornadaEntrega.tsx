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
  const rotulo =
    estado.tom === 'aprovado'
      ? 'Cliente aprovou'
      : estado.tom === 'ajuste'
        ? 'Ajuste solicitado'
        : estado.tom === 'aguardando'
          ? 'Aguardando cliente'
          : estado.tom === 'atrasado'
            ? 'Atenção'
            : estado.tom === 'concluido'
              ? 'Projeto entregue'
              : 'Próxima ação';

  return (
    <section className={styles.card} data-tom={estado.tom} aria-labelledby="jornada-titulo">
      <span className={styles.icone} aria-hidden="true">
        {estado.tom === 'concluido' || estado.tom === 'aprovado' ? (
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
        <p>{rotulo}</p>
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
