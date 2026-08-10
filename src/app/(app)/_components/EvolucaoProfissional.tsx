import Link from 'next/link';
import styles from './EvolucaoProfissional.module.css';

type EtapaEvolucao = 'formacoes' | 'mentorias' | 'certificados';

const ETAPAS: Array<{
  id: EtapaEvolucao;
  indice: string;
  href: string;
  titulo: string;
  descricao: string;
}> = [
  {
    id: 'formacoes',
    indice: '01',
    href: '/formacoes',
    titulo: 'Formações',
    descricao: 'Ganhar repertório aplicado',
  },
  {
    id: 'mentorias',
    indice: '02',
    href: '/mentorias',
    titulo: 'Mentorias',
    descricao: 'Resolver casos reais',
  },
  {
    id: 'certificados',
    indice: '03',
    href: '/certificados',
    titulo: 'Certificados',
    descricao: 'Comprovar o que concluiu',
  },
];

/**
 * O cabeçalho compartilhado transforma três destinos do menu numa jornada só.
 * A sequência é estrutural — aprender, praticar, comprovar — e por isso usa
 * números e uma linha contínua, não três cards decorativos com ícones.
 */
export function EvolucaoProfissional({
  etapa,
  titulo,
  descricao,
}: {
  etapa: EtapaEvolucao;
  titulo: string;
  descricao: string;
}) {
  return (
    <header className={styles.cabecalho}>
      <div className={styles.introducao}>
        <div className={styles.titulos}>
          <p className={styles.eyebrow}>Evolução profissional</p>
          <h1 className={styles.titulo}>{titulo}</h1>
        </div>
        <p className={styles.descricao}>{descricao}</p>
      </div>

      <nav className={styles.navegacao} aria-label="Jornada de evolução profissional">
        <ol className={styles.etapas}>
          {ETAPAS.map((item) => {
            const ativa = item.id === etapa;
            return (
              <li key={item.id} className={styles.etapa} data-ativa={ativa ? '' : undefined}>
                <Link
                  href={item.href}
                  className={styles.link}
                  aria-current={ativa ? 'page' : undefined}
                >
                  <span className={styles.indice}>{item.indice}</span>
                  <span className={styles.textos}>
                    <strong className={styles.nome}>{item.titulo}</strong>
                    <span className={styles.papel}>{item.descricao}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>
    </header>
  );
}
