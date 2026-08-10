import { Skeleton } from '@/design-system/via';
import { CabecalhoPagina } from './CabecalhoPagina';
import styles from './CarregandoModulo.module.css';

type Anatomia =
  'pipeline' | 'calls' | 'documentos' | 'relatorios' | 'mentorias' | 'certificados' | 'consultor';

const CONFIGURACAO: Record<
  Anatomia,
  { titulo: string; metricas: number; colunas: number; momentoEscuro: boolean }
> = {
  pipeline: { titulo: 'CRM', metricas: 3, colunas: 5, momentoEscuro: false },
  calls: { titulo: 'Calls', metricas: 0, colunas: 2, momentoEscuro: true },
  documentos: { titulo: 'Propostas', metricas: 4, colunas: 3, momentoEscuro: true },
  relatorios: { titulo: 'Diagnósticos', metricas: 3, colunas: 1, momentoEscuro: true },
  mentorias: { titulo: 'Mentorias', metricas: 0, colunas: 3, momentoEscuro: true },
  certificados: { titulo: 'Certificados', metricas: 0, colunas: 2, momentoEscuro: true },
  consultor: { titulo: 'Sobral AI', metricas: 0, colunas: 4, momentoEscuro: true },
};

/**
 * Skeleton de rota com a mesma anatomia do módulo que chegará depois.
 *
 * O shell, o breadcrumb e o destino permanecem estáveis; muda apenas o conteúdo
 * ainda dependente do servidor. Isso reduz a sensação de tela travada e evita a
 * troca brusca do skeleton genérico por layouts completamente diferentes.
 */
export function CarregandoModulo({ anatomia }: { anatomia: Anatomia }) {
  const configuracao = CONFIGURACAO[anatomia];

  return (
    <div
      className={styles.pagina}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={`Preparando ${configuracao.titulo}`}
      data-anatomia={anatomia}
    >
      <CabecalhoPagina titulo={configuracao.titulo} oculto />
      <span className="sr-only">Carregando os dados desta área.</span>

      <div aria-hidden="true" className={styles.conteudo}>
        <header className={styles.topo}>
          <div className={styles.introducao}>
            <Skeleton variant="text" width={132} />
            <Skeleton variant="rect" width="min(82%, 520px)" height={112} />
            <Skeleton variant="text" width="min(92%, 610px)" lines={2} />
          </div>
          <Skeleton variant="rect" width={132} height={40} />
        </header>

        {configuracao.momentoEscuro && (
          <section className={styles.momentoEscuro}>
            <Skeleton variant="text" width={118} />
            <Skeleton variant="rect" width="min(72%, 510px)" height={38} />
            <div className={styles.linhasEscuras}>
              {Array.from({ length: anatomia === 'calls' ? 4 : 3 }, (_, indice) => (
                <span key={indice} />
              ))}
            </div>
          </section>
        )}

        {configuracao.metricas > 0 && (
          <section className={styles.metricas}>
            {Array.from({ length: configuracao.metricas }, (_, indice) => (
              <article key={indice}>
                <Skeleton variant="text" width="48%" />
                <Skeleton variant="rect" width="34%" height={34} />
                <Skeleton variant="text" width="68%" />
              </article>
            ))}
          </section>
        )}

        <section className={styles.areaFinal}>
          <div className={styles.areaTitulo}>
            <Skeleton variant="rect" width={210} height={30} />
            <Skeleton variant="text" width={320} />
          </div>
          <div
            className={styles.grade}
            style={{ ['--colunas-carregamento' as string]: configuracao.colunas }}
          >
            {Array.from({ length: configuracao.colunas }, (_, indice) => (
              <article key={indice}>
                <Skeleton variant="text" width="54%" />
                <Skeleton variant="text" width="76%" />
                <Skeleton
                  variant="rect"
                  width="100%"
                  height={anatomia === 'pipeline' ? 112 : anatomia === 'certificados' ? 132 : 82}
                />
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
