'use client';

import Link from 'next/link';
import {
  useProgresso,
  contarConcluidas,
  percentual,
  formacaoMaisRecente,
} from '@/lib/progresso/local';
import type { FormacaoResumo } from '@/lib/conteudo/queries';
import styles from './RetomadaFormacao.module.css';

/**
 * "Continue de onde parou" — a pill que devolve o aluno à formação tocada mais
 * recentemente. Só renderiza quando EXISTE progresso local; para quem nunca
 * começou, nada aparece (um convite vazio seria dado inventado).
 */
export function RetomadaFormacao({ formacoes }: { formacoes: FormacaoResumo[] }) {
  const progresso = useProgresso();
  const slug = formacaoMaisRecente(progresso);
  const formacao = slug ? formacoes.find((f) => f.slug === slug) : undefined;
  if (!formacao) return null;

  const feitas = contarConcluidas(progresso, formacao.aulaIds);
  const pct = percentual(feitas, formacao.aulas);

  return (
    <Link href={`/formacoes/${formacao.slug}`} className={styles.pill}>
      <span className={styles.textos}>
        <span className={styles.rotulo}>Continue de onde parou</span>
        <span className={styles.titulo}>{formacao.titulo}</span>
        <span className={styles.contagem}>
          {feitas}/{formacao.aulas} aulas
        </span>
      </span>
      <span className={styles.trilho} aria-hidden="true">
        <span
          className={styles.preenchido}
          style={{ transform: `scaleX(${Math.max(0.02, pct / 100)})` }}
        />
      </span>
      <span className={styles.acao}>Continuar</span>
    </Link>
  );
}
