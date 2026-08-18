import Link from 'next/link';
import {
  ArrowUpRight,
  BriefcaseBusiness,
  ContactRound,
  FileText,
  ListChecks,
  Video,
} from 'lucide-react';
import type { ItemRadarSobral } from '@/lib/consultor/radar';
import styles from '../pagina.module.css';

const DOMINIOS = {
  crm: {
    rotulo: 'CRM',
    icone: <ContactRound size={17} strokeWidth={1.8} aria-hidden="true" />,
  },
  calls: {
    rotulo: 'Calls',
    icone: <Video size={17} strokeWidth={1.8} aria-hidden="true" />,
  },
  propostas: {
    rotulo: 'Propostas',
    icone: <FileText size={17} strokeWidth={1.8} aria-hidden="true" />,
  },
  projetos: {
    rotulo: 'Projetos',
    icone: <BriefcaseBusiness size={17} strokeWidth={1.8} aria-hidden="true" />,
  },
  plano: {
    rotulo: 'Compromissos',
    icone: <ListChecks size={17} strokeWidth={1.8} aria-hidden="true" />,
  },
} as const;

export function RadarOperacional({ itens }: { itens: ItemRadarSobral[] }) {
  return (
    <section className={styles.radar} aria-labelledby="radar-operacional-titulo">
      <header className={styles.radarCabecalho}>
        <div>
          <p className={styles.eyebrow}>Pendências</p>
          <h2 id="radar-operacional-titulo">Itens que precisam de atenção</h2>
        </div>
        <p>
          A lista reúne prazos, calls, propostas e projetos. Os itens mais urgentes aparecem
          primeiro.
        </p>
      </header>

      {itens.length > 0 ? (
        <ol className={styles.radarLista}>
          {itens.map((item, indice) => {
            const dominio = DOMINIOS[item.dominio];
            return (
              <li key={item.id}>
                <Link
                  href={item.destino}
                  className={styles.radarItem}
                  data-estado={item.estado}
                  aria-label={`${dominio.rotulo}: ${item.titulo}`}
                >
                  <span className={styles.radarIndice}>{String(indice + 1).padStart(2, '0')}</span>
                  <span className={styles.radarCorpo}>
                    <span className={styles.radarMeta}>
                      <span>
                        {dominio.icone}
                        {dominio.rotulo}
                      </span>
                      <em>{item.momento}</em>
                    </span>
                    <strong>{item.titulo}</strong>
                    <small>{item.contexto}</small>
                  </span>
                  <span className={styles.radarAbrir} aria-hidden="true">
                    <ArrowUpRight size={17} strokeWidth={1.9} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className={styles.radarVazio}>
          <span className={styles.radarVazioIcone} aria-hidden="true">
            <BriefcaseBusiness size={20} strokeWidth={1.7} />
          </span>
          <div>
            <h3>Nenhum compromisso aberto</h3>
            <p>
              As pendências aparecerão quando houver atividades no CRM, em calls, propostas ou
              projetos.
            </p>
          </div>
          <Link href="/crm">Abrir CRM</Link>
        </div>
      )}
    </section>
  );
}
