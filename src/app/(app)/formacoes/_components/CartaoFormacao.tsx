'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import {
  useProgresso,
  contarConcluidas,
  estadoDoProgresso,
  percentual,
} from '@/lib/progresso/local';
import { PillEstado } from '../../_components/PillEstado';
import { fatia, hashDeterminista } from '../../_components/hashDeterminista';
import type { FormacaoResumo } from '@/lib/conteudo/queries';
import styles from './CartaoFormacao.module.css';

/**
 * Card de formação em PÔSTER VERTICAL 3:4, agora SANGRADO até a borda.
 *
 * A versão anterior encaixava o pôster com 8px de folga dentro de um card com
 * hairline — "um pôster montado sobre uma superfície", era o argumento, e ele
 * lia bem numa peça isolada. Na grade não: cada card somava TRÊS contornos
 * concêntricos (a borda do card, a folga, o raio do pôster), e uma fileira
 * inteira virava uma fileira de molduras.
 *
 * Sem borda e sem folga, quem separa o card do fundo é a SOMBRA sozinha, e o
 * raio é um só, aplicado na peça inteira por `overflow: hidden`.
 *
 * O TÍTULO VIVE NO PÔSTER, sobre um scrim que desce até a base. Foi o que
 * resolveu o retrato: um 3:4 com o texto todo embaixo tem um vazio alto no meio
 * (era o defeito da versão anterior), e um 3:4 com o título ancorado na base lê
 * como pôster editorial. E, principalmente, é UMA anatomia só — funciona igual
 * com capa real e com capa sintética, em vez de duas montagens diferentes
 * convivendo na mesma grade.
 *
 * O scrim não é decoração: é o que garante contraste de branco sobre uma imagem
 * que o admin sobe e que ninguém controla.
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

/**
 * Campo de luz do pôster sintético, derivado do SLUG — não do índice na grade.
 * Assim a mesma formação tem sempre o mesmo pôster, esteja ela em primeiro ou em
 * último depois de um filtro.
 *
 * O HASH MORA EM `hashDeterminista`, dividido com o retrato dos mentores. Estava
 * embutido aqui; duas cópias de uma função de hash é pior que duas cópias de um
 * componente, porque elas divergem num bit sem ninguém notar — as duas continuam
 * "gerando algo bonito", só que a mesma entrada passa a dar saídas diferentes em
 * telas diferentes. O porquê da avalanche e das fatias contínuas está lá.
 *
 * A luz fica na METADE DE CIMA de propósito: embaixo mora a legenda, e luz atrás
 * de texto é contraste perdido. Luz vindo de cima também é a leitura natural.
 */
function campoDoSlug(slug: string): CSSProperties {
  const u = hashDeterminista(slug);
  return {
    '--luz-x': `${(6 + fatia(u, 0) * 86).toFixed(1)}%`,
    '--luz-y': `${(-8 + fatia(u, 8) * 52).toFixed(1)}%`,
    '--eco-x': `${(4 + fatia(u, 16) * 92).toFixed(1)}%`,
    '--eco-y': `${(fatia(u, 24) * 62).toFixed(1)}%`,
    '--base-ang': `${112 + (u % 117)}deg`,
  } as CSSProperties;
}

export function CartaoFormacao({ formacao }: { formacao: FormacaoResumo }) {
  const progresso = useProgresso();
  const feitas = contarConcluidas(progresso, formacao.aulaIds);
  const pct = percentual(feitas, formacao.aulas);
  const estado = estadoDoProgresso(feitas, formacao.aulas);

  return (
    <Link href={`/formacoes/${formacao.slug}`} className={styles.cartao}>
      <div className={styles.moldura}>
        <div className={styles.poster}>
          {formacao.capa_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- capa vem do Storage com URL externa; next/image exige domínio configurado e entra na fase de assets
            <img src={formacao.capa_url} alt="" className={styles.imagem} loading="lazy" />
          ) : (
            <div className={`${styles.sintetica} via-noise`} style={campoDoSlug(formacao.slug)} />
          )}

          <span className={styles.scrim} aria-hidden="true" />

          {/* O MESMO selo do card de solução e do hero do curso — antes aqui só
              existia "Concluída", então o card não tinha coluna de estado até a
              trilha terminar, e a grade lia como duas famílias de card.
              Tom `midia` porque ele pousa sobre a CAPA que o admin sobe: véu
              translúcido ali daria contraste provável, não garantido. */}
          <PillEstado estado={estado} tom="midia" className={styles.selo} />

          {/* Ancorado na base do pôster: eyebrow + título, dois tons SÓLIDOS
              (gray-400 e branco). Sobre banda escura a escala de cinza inverte —
              text-muted aqui reprovaria AA. */}
          <div className={styles.legenda}>
            <span className={styles.eyebrow}>Formação</span>
            <h3 className={styles.titulo}>{formacao.titulo}</h3>
          </div>
        </div>
      </div>

      <div className={styles.corpo}>
        {formacao.resumo && <p className={styles.resumo}>{formacao.resumo}</p>}

        {/* Tira de meta: ícone + número. Mono e tabular para os números não
            dançarem entre um card e outro. */}
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
          percentual à direita.
          SÓ EXISTE SE HÁ AULA. Sem esta guarda, uma formação em montagem (zero
          aulas) mostrava a barra e "0%" — afirmando um progresso possível onde
          não há conteúdo, e contradizendo o `PillEstado`, que some no mesmo caso
          justamente porque `sem-itens` não é um estado exibível. */}
      {formacao.aulas > 0 && (
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
      )}
    </Link>
  );
}
