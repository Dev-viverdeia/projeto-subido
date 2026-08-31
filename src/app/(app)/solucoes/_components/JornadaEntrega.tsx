import { ArrowRight, Check, CircleAlert, Clock3, MessageSquareMore } from 'lucide-react';
import type {
  EstadoJornadaEntrega,
  MomentoJornadaEntrega,
} from '@/lib/projetos-execucao/jornada-entrega';
import styles from './JornadaEntrega.module.css';

const PASSOS: Array<{ id: MomentoJornadaEntrega; rotulo: string }> = [
  { id: 'alinhar', rotulo: 'Alinhar' },
  { id: 'executar', rotulo: 'Executar' },
  { id: 'validar', rotulo: 'Validar' },
  { id: 'entregar', rotulo: 'Entregar' },
];

export function JornadaEntrega({
  estado,
  onAbrir,
}: {
  estado: EstadoJornadaEntrega;
  onAbrir: () => void;
}) {
  const atual = PASSOS.findIndex((passo) => passo.id === estado.momento);

  return (
    <section className={styles.card} data-tom={estado.tom} aria-labelledby="jornada-titulo">
      <div className={styles.topo}>
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
        <p>Próximo movimento</p>
      </div>

      <strong className={styles.titulo} id="jornada-titulo">
        {estado.titulo}
      </strong>
      <p className={styles.descricao}>{estado.descricao}</p>

      <ol className={styles.passos} aria-label="Jornada da entrega">
        {PASSOS.map((passo, indice) => {
          const concluido = estado.tom === 'concluido' || indice < atual;
          const ativo = indice === atual && estado.tom !== 'concluido';
          return (
            <li
              key={passo.id}
              data-concluido={concluido || undefined}
              data-ativo={ativo || undefined}
            >
              <span>{concluido ? <Check size={11} /> : String(indice + 1).padStart(2, '0')}</span>
              {passo.rotulo}
            </li>
          );
        })}
      </ol>

      <button type="button" onClick={onAbrir} aria-label={estado.nomeAcessivelAcao}>
        {estado.rotuloAcao}
        <ArrowRight size={15} aria-hidden="true" />
      </button>
    </section>
  );
}
