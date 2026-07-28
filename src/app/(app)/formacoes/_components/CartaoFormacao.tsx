'use client';

import Link from 'next/link';
import { useProgresso, contarConcluidas, percentual } from '@/lib/progresso/local';
import type { FormacaoResumo } from '@/lib/conteudo/queries';
import styles from './CartaoFormacao.module.css';

/**
 * Card de formação, na linguagem da plataforma de referência: capa grande,
 * TIRA DE META com ícones logo abaixo e a barra de progresso fechando o card
 * com o percentual à direita.
 *
 * A capa fica HORIZONTAL (16:10) e não no retrato 3:4 da referência: lá toda
 * formação tem arte própria com o nome do produto e o instrutor, e o retrato
 * carrega essa arte. Aqui as capas ainda não existem — um retrato de 490px sem
 * arte é um retângulo vazio alto. Quando as artes chegarem, trocar a proporção é
 * uma linha.
 *
 * A capa sintética não repete o TÍTULO (ele vive no corpo): repete a LINGUAGEM
 * da referência — o eyebrow "Formação" em mono espaçado sobre a banda navy.
 *
 * Ícones em SVG inline: este componente é client (usa progresso local), e
 * importar lucide aqui arrastaria a biblioteca para o bundle do browser.
 */
function IconeModulos() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M7 1.5 12.5 4 7 6.5 1.5 4 7 1.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M1.5 7 7 9.5 12.5 7M1.5 10 7 12.5 12.5 10"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconeAulas() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="m5.8 4.7 3.4 2.3-3.4 2.3z" fill="currentColor" />
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
            <span className={styles.sinteticaEyebrow}>Formação</span>
          </div>
        )}
        <span className={styles.veu} aria-hidden="true" />
        {concluida && <span className={styles.selo}>Concluída</span>}
      </div>

      <div className={styles.corpo}>
        <h3 className={styles.titulo}>{formacao.titulo}</h3>
        {formacao.resumo && <p className={styles.resumo}>{formacao.resumo}</p>}

        {/* Tira de meta: ícone + número, como na referência. Mono e tabular para
            os números não dançarem entre um card e outro. */}
        <div className={styles.tira}>
          <span className={styles.item}>
            <IconeModulos />
            {formacao.modulos} {formacao.modulos === 1 ? 'módulo' : 'módulos'}
          </span>
          <span className={styles.item}>
            <IconeAulas />
            {formacao.aulas} {formacao.aulas === 1 ? 'aula' : 'aulas'}
          </span>
        </div>
      </div>

      {/* Fecha o card, encostado na base: trilho de largura total com o
          percentual à direita — o mesmo desenho da referência. */}
      <div className={styles.progresso}>
        <div className={styles.trilho} aria-hidden="true">
          <div
            className={styles.preenchido}
            style={{ transform: `scaleX(${feitas > 0 ? Math.max(0.02, pct / 100) : 0})` }}
          />
        </div>
        <span className={styles.pct} data-comecou={feitas > 0 ? '' : undefined}>
          {pct}%
        </span>
      </div>
    </Link>
  );
}
