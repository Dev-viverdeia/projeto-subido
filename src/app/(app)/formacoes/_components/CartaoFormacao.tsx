'use client';

import Link from 'next/link';
import type { FormacaoResumo } from '@/lib/conteudo/queries';
import {
  contarConcluidas,
  estadoDoProgresso,
  percentual,
  useProgresso,
} from '@/lib/progresso/local';
import { PillEstado } from '../../_components/PillEstado';
import styles from './CartaoFormacao.module.css';

type Props = {
  formacao: FormacaoResumo;
  numero: number;
  etapa: string;
  foco: string;
  recomendada?: boolean;
};

function rotuloAcao(feitas: number, total: number) {
  if (total > 0 && feitas >= total) return 'Revisar formação';
  if (feitas > 0) return 'Retomar formação';
  return 'Começar formação';
}

function Seta() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 8h9M8.5 4.5 12 8l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CartaoFormacao({ formacao, numero, etapa, foco, recomendada = false }: Props) {
  const progresso = useProgresso();
  const feitas = contarConcluidas(progresso, formacao.aulaIds);
  const pct = percentual(feitas, formacao.aulas);
  const estado = estadoDoProgresso(feitas, formacao.aulas);

  return (
    <Link
      href={`/formacoes/${formacao.slug}`}
      className={styles.cartao}
      data-recomendada={recomendada ? '' : undefined}
    >
      <div className={styles.capa} aria-hidden="true">
        {formacao.capa_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- imagem publicada no Storage, sem domínio estável para next/image
          <img src={formacao.capa_url} alt="" loading="lazy" />
        ) : (
          <span className={styles.capaFallback}>{String(numero).padStart(2, '0')}</span>
        )}
        <span className={styles.capaVela} />
        <span className={styles.numero}>{String(numero).padStart(2, '0')}</span>
      </div>

      <div className={styles.corpo}>
        <div className={styles.topo}>
          <div className={styles.identidade}>
            <span className={styles.etapa}>{etapa}</span>
            {recomendada && <span className={styles.recomendada}>Recomendada agora</span>}
          </div>
          <PillEstado estado={estado} />
        </div>

        <div className={styles.conteudo}>
          <h3>{formacao.titulo}</h3>
          <p>{foco}</p>
        </div>

        <div className={styles.rodape}>
          <div className={styles.progresso}>
            <div className={styles.progressoTexto}>
              <span>
                {formacao.modulos} {formacao.modulos === 1 ? 'módulo' : 'módulos'} ·{' '}
                {formacao.aulas} {formacao.aulas === 1 ? 'aula' : 'aulas'}
              </span>
              <strong>{pct}%</strong>
            </div>
            <div className={styles.trilho} aria-hidden="true">
              <span style={{ transform: `scaleX(${pct / 100})` }} />
            </div>
          </div>

          <span className={styles.acao}>
            {rotuloAcao(feitas, formacao.aulas)}
            <Seta />
          </span>
        </div>
      </div>
    </Link>
  );
}
