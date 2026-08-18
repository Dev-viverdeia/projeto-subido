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
 * recentemente. Só renderiza quando EXISTE progresso na conta; para quem nunca
 * começou, nada aparece (um convite vazio seria dado inventado).
 *
 * VIVE SÓ NO `/inicio` AGORA. O catálogo de formações usava esta pill como
 * abertura e não respondia "quanto existe" nem "quanto eu já fiz" — passou a usar
 * a `ResumoCatalogo`, a mesma faixa de três medidas do catálogo de soluções. Aqui
 * no início a faixa não cabe: a tela compõe TRÊS pilares, e cada um tem direito a
 * uma linha, não a um painel de métricas.
 */
export function RetomadaFormacao({ formacoes }: { formacoes: FormacaoResumo[] }) {
  const progresso = useProgresso();
  const slug = formacaoMaisRecente(progresso);
  const formacao = slug ? formacoes.find((f) => f.slug === slug) : undefined;
  if (!formacao) return null;

  const feitas = contarConcluidas(progresso, formacao.aulaIds);

  /* A MESMA REGRA da faixa de resumo do catálogo, e ela estava divergindo: aqui
     bastava ter TOCADO a formação, lá era preciso ter algo por terminar. O
     resultado era o `/inicio` convidando a "continuar de onde parou" uma trilha
     100% concluída enquanto o catálogo, na mesma sessão, não oferecia retomada
     nenhuma. Duas telas discordando sobre o mesmo dado. */
  if (feitas === 0 || feitas >= formacao.aulas) return null;

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
      <span className={styles.acao}>Continuar formação</span>
    </Link>
  );
}
