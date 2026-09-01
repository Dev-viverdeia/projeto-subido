import type { ReuniaoCall } from '@/lib/calls/queries';
import { ROTULO_TIPO_CALL } from '@/lib/calls/tipos';
import { ResolverReuniaoPendente } from './ResolverReuniaoPendente';
import styles from '../pagina.module.css';

const DATA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  timeZone: 'America/Sao_Paulo',
});
const HORA = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

export function PendenciasReunioes({ reunioes }: { reunioes: ReuniaoCall[] }) {
  if (reunioes.length === 0) return null;
  return (
    <section className={styles.pendencias} aria-labelledby="pendencias-reunioes-titulo">
      <header className={styles.secaoTopo}>
        <div>
          <p className={styles.sobretitulo}>Agenda para revisar</p>
          <h2 id="pendencias-reunioes-titulo">
            {reunioes.length === 1
              ? 'Uma reunião precisa de uma decisão'
              : `${reunioes.length} reuniões precisam de uma decisão`}
          </h2>
          <p>Os horários passaram, mas essas reuniões não foram concluídas.</p>
        </div>
      </header>
      <div className={styles.pendenciasLista}>
        {reunioes.map((reuniao) => (
          <article key={reuniao.id}>
            <div className={styles.pendenciaData}>
              <strong>{DATA.format(new Date(reuniao.agendadaPara)).replace('.', '')}</strong>
              <span>{HORA.format(new Date(reuniao.agendadaPara))}</span>
            </div>
            <div className={styles.pendenciaConteudo}>
              <span>{ROTULO_TIPO_CALL[reuniao.tipo]}</span>
              <h3>{reuniao.titulo}</h3>
              <p>
                {reuniao.empresa}
                {reuniao.contato ? ` · ${reuniao.contato}` : ''}
              </p>
            </div>
            <ResolverReuniaoPendente reuniaoId={reuniao.id} />
          </article>
        ))}
      </div>
    </section>
  );
}
