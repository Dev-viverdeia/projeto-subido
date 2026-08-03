'use client';

import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useNavegacaoPorSetas } from './useNavegacaoPorSetas';
import styles from './ControleSegmentado.module.css';

export type OpcaoSegmentada = {
  id: string;
  rotulo: string;
  /** Contagem à direita do rótulo. Opcional — sem ela a opção é só a palavra. */
  total?: number;
  /** SVG inline, nunca `lucide`: este componente é client. */
  icone?: ReactNode;
};

/**
 * CONTROLE SEGMENTADO — trilho recuado, polegar erguido, um só ativo.
 *
 * POR QUE ELE EXISTE COMO COMPONENTE
 * O padrão já estava escrito duas vezes: no `SeletorVista` das mentorias e, em
 * outra forma, nas abas de catálogo. Dois arquivos que precisam parecer iguais é
 * a história que abre o CLAUDE.md — então o desenho mora aqui, e quem precisa dele
 * passa opções.
 *
 * O TRIPLO DE ELEVAÇÃO faz o trabalho: o trilho é a superfície RECUADA
 * (`--via-bg-2` com hairline) e o polegar é a ERGUIDA (`--app-elev-1-*`, fundo +
 * linha + sombra andando juntos). Sombra escolhida sozinha é o que faz um
 * segmentado parecer um botão colado num fundo.
 *
 * O POLEGAR FICA ATRÁS do conteúdo. Animar o fundo em vez do texto é o que impede
 * o rótulo de tremer durante a troca — e é por isso que ele é um irmão absoluto,
 * não um `background` do próprio botão.
 *
 * `layoutId` É OBRIGATÓRIO E ÚNICO POR TELA. Dois controles com o mesmo id
 * compartilhariam o polegar, e ele voaria de um trilho para o outro a cada clique.
 *
 * SETAS DO TECLADO em `useNavegacaoPorSetas`. Ele declara `role="tablist"` desde
 * sempre e não cumpria o contrato: quem usa leitor de tela ouve "guia 2 de 3" e
 * tenta as setas. O `AbasFiltro` — que vive na MESMA régua — já as tinha, então os
 * dois controles lado a lado respondiam diferente ao mesmo teclado.
 */
export function ControleSegmentado({
  opcoes,
  ativa,
  aoMudar,
  layoutId,
  ariaLabel,
  /** `full` faz o trilho ocupar a linha e dividir as opções por igual. */
  largura = 'auto',
}: {
  opcoes: OpcaoSegmentada[];
  ativa: string;
  aoMudar: (id: string) => void;
  layoutId: string;
  ariaLabel: string;
  largura?: 'auto' | 'full';
}) {
  const reduzir = useReducedMotion();
  const { trilho, aoTeclar, tabIndexDe } = useNavegacaoPorSetas({ itens: opcoes, ativa, aoMudar });

  return (
    <div
      ref={trilho}
      role="tablist"
      aria-label={ariaLabel}
      className={styles.trilho}
      data-largura={largura === 'full' ? '' : undefined}
      onKeyDown={aoTeclar}
    >
      {opcoes.map((opcao) => {
        const ativo = opcao.id === ativa;
        return (
          <button
            key={opcao.id}
            role="tab"
            type="button"
            data-id={opcao.id}
            aria-selected={ativo}
            /* Tabindex rotativo: o trilho inteiro é UMA parada de Tab, e as setas
               movem dentro dele. É o par obrigatório do `onKeyDown` acima. */
            tabIndex={tabIndexDe(opcao.id)}
            className={styles.opcao}
            data-ativa={ativo ? '' : undefined}
            onClick={() => aoMudar(opcao.id)}
          >
            {ativo && (
              <motion.span
                layoutId={layoutId}
                className={styles.polegar}
                transition={
                  reduzir
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 420, damping: 34, mass: 0.8 }
                }
              />
            )}
            <span className={styles.conteudo}>
              {opcao.icone}
              {opcao.rotulo}
              {/* A contagem responde "vale a pena clicar?" ANTES do clique. Fica um
                  degrau mais quieta que o rótulo para a opção continuar lendo como
                  uma palavra, não como duas. */}
              {opcao.total !== undefined && <span className={styles.total}>{opcao.total}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
