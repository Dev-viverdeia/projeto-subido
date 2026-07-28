'use client';

import Link from 'next/link';
import { useProgresso, contarConcluidas, percentual } from '@/lib/progresso/local';
import type { FormacaoResumo } from '@/lib/conteudo/queries';
import styles from './CartaoFormacao.module.css';

/**
 * Card de formação — PÔSTER 3:4 com capa, deliberadamente diferente do card de
 * solução (que é texto): dois pilares, duas fisionomias. Sem `capa_url`, o
 * fallback é um pôster sintético navy com o título — nunca imagem de banco.
 *
 * A barra de progresso só EXISTE quando há progresso (regra: nunca inventar
 * dado; 0% para quem nunca abriu é ruído, não informação).
 */
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
            <span className={styles.sinteticaTitulo}>{formacao.titulo}</span>
          </div>
        )}
        <span className={styles.veu} aria-hidden="true" />
      </div>

      <div className={styles.corpo}>
        <h3 className={styles.titulo}>{formacao.titulo}</h3>
        <p className={styles.meta}>
          {formacao.modulos} {formacao.modulos === 1 ? 'módulo' : 'módulos'} · {formacao.aulas}{' '}
          {formacao.aulas === 1 ? 'aula' : 'aulas'}
          {feitas > 0 && <span className={styles.pct}>{concluida ? 'Concluída' : `${pct}%`}</span>}
        </p>
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
