'use client';

import type { ItemSolucao } from '@/lib/conteudo/queries';
import { percentual } from '@/lib/progresso/local';
import styles from './TrilhoProgresso.module.css';

/**
 * O trilho de progresso da ficha — o card do topo da coluna direita.
 *
 * A BARRA É SEGMENTADA, uma casa por etapa, e isso é decisão de informação, não
 * de enfeite: numa solução de cinco etapas a barra contínua transforma "3 de 5"
 * em "algo perto de 60%", que é justamente o dado que a pessoa já tem escrito
 * abaixo. Com casas, a barra passa a dizer o que o texto não diz — QUAIS faltam.
 * Acima de 12 etapas as casas ficariam finas demais para contar de relance, e aí
 * a barra volta a ser contínua.
 *
 * "CONTINUAR" NÃO NAVEGA — leva à etapa atual, que está nesta mesma página. Um
 * botão que troca de rota para chegar a um elemento visível seria mentira de
 * afordância; aqui ele rola e abre.
 *
 * ZERO ETAPAS não renderiza card nenhum: uma barra vazia sob o título "seu
 * progresso" afirma que existe progresso a fazer onde não há passo a passo
 * cadastrado.
 */
const MAX_SEGMENTOS = 12;

export function TrilhoProgresso({
  etapas,
  feitasIds,
  etapaAtual,
  aoContinuar,
}: {
  etapas: ItemSolucao[];
  /**
   * Os ids das etapas DESTA solução que estão marcadas — não a contagem.
   *
   * A diferença é o ponto inteiro da barra segmentada. Com um número, a única
   * coisa possível é pintar as N primeiras casas; e como marcar etapa é
   * checklist (alterna, fora de ordem), quem marcasse a 3ª veria a 1ª acender.
   * A barra passaria a contradizer a timeline logo ao lado.
   */
  feitasIds: ReadonlySet<string>;
  /** A primeira não marcada — `null` quando todas estão feitas. */
  etapaAtual: ItemSolucao | null;
  aoContinuar: () => void;
}) {
  const total = etapas.length;
  if (total === 0) return null;

  const feitas = feitasIds.size;
  const pct = percentual(feitas, total);
  const concluida = feitas >= total;

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

      {total <= MAX_SEGMENTOS ? (
        <ol className={styles.segmentos} aria-hidden="true">
          {etapas.map((etapa) => (
            <li
              key={etapa.id}
              className={styles.segmento}
              data-feito={feitasIds.has(etapa.id) ? '' : undefined}
            />
          ))}
        </ol>
      ) : (
        <div className={styles.continuo} aria-hidden="true">
          {/* `scaleX` e nunca `width`: width dispara layout a cada frame. */}
          <span className={styles.preenchido} style={{ transform: `scaleX(${pct / 100})` }} />
        </div>
      )}

      <p className={styles.frase}>
        {concluida ? (
          <>
            {/* Concordância: uma solução de etapa única dizia "As 1 etapas estão
                marcadas". Plural fixo é o defeito mais fácil de escrever e o mais
                visível quando acontece. */}
            {total === 1 ? 'A única etapa está marcada' : `As ${total} etapas estão marcadas`}. O
            progresso é deste navegador — ele não acompanha você em outro dispositivo.
          </>
        ) : (
          <>
            {feitas} de {total} {total === 1 ? 'etapa concluída' : 'etapas concluídas'}.
            {etapaAtual && (
              <>
                {' '}
                Próxima: <em className={styles.proxima}>{etapaAtual.titulo}</em>.
              </>
            )}
          </>
        )}
      </p>

      {!concluida && etapaAtual && (
        <button type="button" className={styles.continuar} onClick={aoContinuar}>
          {feitas === 0 ? 'Começar' : 'Continuar'}
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M3 8h9m0 0L8.5 4.5M12 8l-3.5 3.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </section>
  );
}
