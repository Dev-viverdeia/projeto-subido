import type { ItemSolucao } from '@/lib/conteudo/queries';
import styles from './PassoAPasso.module.css';

/**
 * O passo a passo da solução — Server Component, lista numerada EDITORIAL.
 *
 * A plataforma de referência abandonou o passo a passo por não ter o dado; aqui
 * `solucao_itens` tipo `etapa` existe e é o diferencial da tela. Número em mono
 * (01, 02…), título com peso, corpo em tinta de leitura, hairline entre passos —
 * nada de card por passo, que fatiaria a leitura.
 */
export function PassoAPasso({ etapas }: { etapas: ItemSolucao[] }) {
  if (etapas.length === 0) return null;

  return (
    <section aria-labelledby="passo-a-passo-titulo" className={styles.secao}>
      <h2 id="passo-a-passo-titulo" className={styles.eyebrow}>
        Passo a passo
        <span className={styles.total}>{etapas.length}</span>
      </h2>

      <ol className={styles.lista}>
        {etapas.map((etapa, i) => (
          <li key={etapa.id} className={styles.passo}>
            <span className={styles.numero} aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className={styles.corpo}>
              <h3 className={styles.tituloPasso}>{etapa.titulo}</h3>
              {etapa.conteudo && <p className={styles.texto}>{etapa.conteudo}</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
