'use client';

import Link from 'next/link';
import { percentual } from '@/lib/progresso/local';
import styles from './TrilhoProgresso.module.css';

/**
 * O trilho de progresso — o card do topo da coluna de apoio, nos DOIS pilares.
 *
 * GENÉRICO PORQUE A CONTA É A MESMA. A solução conta etapas, a formação conta
 * aulas; tudo o que muda é o substantivo e para onde o botão leva. Enquanto isso
 * era um componente de soluções, o curso mantinha a própria versão — e ela tinha
 * um defeito que só aparece comparando as duas telas lado a lado: o mesmo número
 * aparecia DUAS VEZES na mesma página, no hero e na lateral. Dois lugares que
 * dizem o mesmo é um lugar a mais para desalinhar.
 *
 * A BARRA É SEGMENTADA, uma casa por item, e isso é decisão de informação, não de
 * enfeite: numa solução de cinco etapas a barra contínua transforma "3 de 5" em
 * "algo perto de 60%", que é justamente o dado já escrito abaixo. Com casas, a
 * barra passa a dizer o que o texto não diz — QUAIS faltam. Acima de 12 itens as
 * casas ficariam finas demais para contar de relance (um curso tem dezenas de
 * aulas), e aí ela volta a ser contínua.
 *
 * ZERO ITENS não renderiza card nenhum: uma barra vazia sob "seu progresso"
 * afirma que existe progresso a fazer onde não há conteúdo cadastrado.
 */
const MAX_SEGMENTOS = 12;

export type ItemProgresso = { id: string; titulo: string };

export function TrilhoProgresso({
  itens,
  feitasIds,
  proximo,
  unidade,
  href,
  aoContinuar,
  notaFinal,
  denso = false,
}: {
  itens: ItemProgresso[];
  /**
   * Os ids DESTE conteúdo que estão marcados — não a contagem.
   *
   * A diferença é o ponto inteiro da barra segmentada. Com um número, a única
   * coisa possível é pintar as N primeiras casas; e como marcar etapa alterna e
   * pode acontecer fora de ordem, quem marcasse a 3ª veria a 1ª acender. A barra
   * passaria a contradizer a lista logo ao lado.
   */
  feitasIds: ReadonlySet<string>;
  /** O primeiro não marcado — `null` quando tudo está feito. */
  proximo: ItemProgresso | null;
  unidade: { singular: string; plural: string };
  /** Navegação (curso → aula). Excludente com `aoContinuar`. */
  href?: string;
  /** Ação na própria página (ficha → rolar até a etapa). Excludente com `href`. */
  aoContinuar?: () => void;
  /** Frase extra do estado concluído — o que acontece depois de terminar. */
  notaFinal?: string;
  /**
   * Variante de TRILHO, não de card: sem pele, sem frase, sem botão.
   *
   * A playlist da aula vive num painel estreito que já é um card, e já lista as
   * aulas logo abaixo — ali o cartão inteiro seria um card dentro de outro e a
   * frase "Próxima: …" repetiria o que a lista mostra marcado. O que sobra é o
   * que a densidade daquele lugar comporta: rótulo, número e barra. Mesma
   * gramática, outra densidade — em vez de uma TERCEIRA maneira de desenhar o
   * mesmo progresso, que era o que existia ali.
   */
  denso?: boolean;
}) {
  const total = itens.length;
  if (total === 0) return null;

  const feitas = feitasIds.size;
  const pct = percentual(feitas, total);
  const concluida = feitas >= total;
  const rotuloAcao = feitas === 0 ? 'Começar' : 'Continuar';

  const seta = (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 8h9m0 0L8.5 4.5M12 8l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const barra =
    total <= MAX_SEGMENTOS ? (
      <ol className={styles.segmentos} aria-hidden="true">
        {itens.map((item) => (
          <li
            key={item.id}
            className={styles.segmento}
            data-feito={feitasIds.has(item.id) ? '' : undefined}
          />
        ))}
      </ol>
    ) : (
      <div className={styles.continuo} aria-hidden="true">
        {/* `scaleX` e nunca `width`: width dispara layout a cada frame. */}
        <span className={styles.preenchido} style={{ transform: `scaleX(${pct / 100})` }} />
      </div>
    );

  if (denso) {
    return (
      <section aria-label="Seu progresso" className={styles.denso}>
        <div className={styles.topo}>
          <p className={styles.eyebrow}>Seu progresso</p>
          <p className={styles.pct}>
            {pct}
            <span className={styles.simbolo}>%</span>
          </p>
        </div>
        {barra}
        <p className={styles.contagemDensa}>
          {feitas} de {total} {total === 1 ? unidade.singular : unidade.plural}{' '}
          {total === 1 ? 'concluída' : 'concluídas'}
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="progresso-titulo" className={styles.card}>
      <div className={styles.topo}>
        <h2 id="progresso-titulo" className={styles.eyebrow}>
          Seu progresso
        </h2>
        <p className={styles.pct}>
          {pct}
          <span className={styles.simbolo}>%</span>
        </p>
      </div>

      {barra}

      <p className={styles.frase}>
        {concluida ? (
          <>
            {/* Concordância: um conteúdo de item único dizia "As 1 etapas estão
                marcadas". Plural fixo é o defeito mais fácil de escrever e o mais
                visível quando acontece. */}
            {total === 1
              ? `A única ${unidade.singular} está marcada`
              : `As ${total} ${unidade.plural} estão marcadas`}
            .{notaFinal ? ` ${notaFinal}` : ''}
          </>
        ) : (
          <>
            {feitas} de {total}{' '}
            {total === 1 ? `${unidade.singular} concluída` : `${unidade.plural} concluídas`}.
            {proximo && (
              <>
                {' '}
                Próxima: <em className={styles.proxima}>{proximo.titulo}</em>.
              </>
            )}
          </>
        )}
      </p>

      {!concluida &&
        proximo &&
        (href ? (
          <Link href={href} className={styles.continuar}>
            {rotuloAcao}
            {seta}
          </Link>
        ) : aoContinuar ? (
          <button type="button" className={styles.continuar} onClick={aoContinuar}>
            {rotuloAcao}
            {seta}
          </button>
        ) : null)}
    </section>
  );
}
