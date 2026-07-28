'use client';

import Link from 'next/link';
import { useProgresso, contarConcluidas, percentual } from '@/lib/progresso/local';
import type { FormacaoResumo } from '@/lib/conteudo/queries';
import styles from './CartaoFormacao.module.css';

/**
 * Card de formação — capa 16:10 + corpo, deliberadamente diferente do card de
 * solução (que é só texto): dois pilares, duas fisionomias.
 *
 * A CAPA SINTÉTICA NÃO REPETE O TÍTULO. Ela mostrava o título e o corpo mostrava
 * de novo, logo abaixo — o mesmo texto duas vezes no mesmo card. Sem `capa_url`
 * entra uma marca gráfica (três barras = os módulos empilhados) sobre a banda
 * navy: uma capa que parece decidida, não um placeholder, e o título vive num
 * lugar só — o que também vale quando a capa REAL não trouxer texto.
 *
 * A barra de progresso só EXISTE quando há progresso (regra: nunca inventar
 * dado; 0% para quem nunca abriu é ruído, não informação).
 */
function MarcaDaCapa() {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none" aria-hidden="true">
      <rect x="8" y="12" width="36" height="7" rx="3.5" fill="currentColor" />
      <rect x="8" y="23" width="28" height="7" rx="3.5" fill="currentColor" />
      <rect x="8" y="34" width="18" height="7" rx="3.5" fill="currentColor" />
    </svg>
  );
}

export function CartaoFormacao({ formacao }: { formacao: FormacaoResumo }) {
  const progresso = useProgresso();
  const feitas = contarConcluidas(progresso, formacao.aulaIds);
  const pct = percentual(feitas, formacao.aulas);
  const concluida = formacao.aulas > 0 && feitas === formacao.aulas;

  return (
    <Link href={`/formacoes/${formacao.slug}`} className={styles.cartao}>
      <div className={styles.capa}>
        {formacao.capa_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- capa vem do Storage com URL externa; next/image exige domínio configurado e entra na fase de assets
          <img src={formacao.capa_url} alt="" className={styles.imagem} loading="lazy" />
        ) : (
          <div className={`${styles.sintetica} via-mesh-navy via-noise`}>
            <MarcaDaCapa />
          </div>
        )}
        <span className={styles.veu} aria-hidden="true" />
        {concluida && <span className={styles.selo}>Concluída</span>}
      </div>

      <div className={styles.corpo}>
        <h3 className={styles.titulo}>{formacao.titulo}</h3>
        {formacao.resumo && <p className={styles.resumo}>{formacao.resumo}</p>}

        <div className={styles.rodape}>
          <p className={styles.meta}>
            {formacao.modulos} {formacao.modulos === 1 ? 'módulo' : 'módulos'} · {formacao.aulas}{' '}
            {formacao.aulas === 1 ? 'aula' : 'aulas'}
          </p>
          {feitas > 0 && !concluida && <span className={styles.pct}>{pct}%</span>}
        </div>

        {feitas > 0 && (
          <div className={styles.trilho} aria-hidden="true">
            <div
              className={styles.preenchido}
              style={{ transform: `scaleX(${Math.max(0.02, pct / 100)})` }}
            />
          </div>
        )}
      </div>
    </Link>
  );
}
