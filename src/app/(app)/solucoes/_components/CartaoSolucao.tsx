'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import type { SolucaoResumo } from '@/lib/conteudo/queries';
import {
  contarEtapasFeitas,
  estadoDaSolucao,
  percentual,
  useProgresso,
} from '@/lib/progresso/local';
import styles from './CartaoSolucao.module.css';

/* Só os dois estados que o card mostra. `sem-etapas` e `nao-iniciada` não viram
   pill — ver o comentário do componente. */
const ROTULO_ESTADO: Record<'em-andamento' | 'concluida', string> = {
  'em-andamento': 'em andamento',
  concluida: 'concluída',
};

/**
 * Card do catálogo de soluções — SEM capa, de propósito. O texto carrega o card
 * (decisão herdada da plataforma de referência), e a categoria entra como
 * intensidade de navy no chip-glifo, nunca como cor nova.
 *
 * O `icone` chega JÁ RENDERIZADO do servidor (padrão navegacao.tsx): este arquivo
 * é client por viver dentro da grade animada, e importar lucide aqui arrastaria a
 * biblioteca para o bundle.
 *
 * Raiz é `<Link>`, não `<div onClick>` — ctrl+clique, botão do meio e "abrir em
 * nova aba" são de graça.
 *
 * O PROGRESSO É DESTE NAVEGADOR, e o card diz a verdade sobre isso ao não mostrar
 * nada quando não há nada: sem etapa marcada, some a pill, some a barra, e o
 * rodapé volta a ser só a contagem do catálogo. Uma pill "não iniciada" em todos
 * os cards de quem acabou de entrar seria ruído com aparência de informação.
 */
export function CartaoSolucao({ solucao, icone }: { solucao: SolucaoResumo; icone: ReactNode }) {
  const progresso = useProgresso();

  const ferramentas = solucao.ferramentas;
  const visiveis = ferramentas.slice(0, 3);
  const extras = ferramentas.length - visiveis.length;

  const total = solucao.etapaIds.length;
  const feitas = contarEtapasFeitas(progresso, solucao.etapaIds);
  const estado = estadoDaSolucao(feitas, total);
  /* `sem-etapas` não é estado de progresso, é ausência de passo a passo. E
     `nao-iniciada` é o estado de TODOS os cards de quem nunca marcou nada —
     mostrá-lo seria pintar a grade inteira com a mesma pill. */
  const emProgresso = estado === 'em-andamento' || estado === 'concluida';

  return (
    <Link
      href={`/solucoes/${solucao.slug}`}
      className={styles.cartao}
      data-estado={emProgresso ? estado : undefined}
    >
      <div className={styles.topo}>
        <span className={styles.glifo} aria-hidden="true">
          {icone}
        </span>
        {solucao.categoria && <p className={styles.eyebrow}>{solucao.categoria}</p>}

        {emProgresso && (
          <span className={styles.estado} data-estado={estado}>
            {ROTULO_ESTADO[estado]}
          </span>
        )}
      </div>

      <h3 className={styles.titulo}>{solucao.titulo}</h3>
      {solucao.resumo && <p className={styles.resumo}>{solucao.resumo}</p>}

      {visiveis.length > 0 && (
        <p className={styles.ferramentas}>
          {visiveis.join(' · ')}
          {extras > 0 && <span className={styles.mais}> +{extras}</span>}
        </p>
      )}

      <span className={styles.vao} />
      <hr className={styles.fio} />

      <footer className={styles.rodape}>
        <span className={styles.contagens}>
          {ferramentas.length > 0 &&
            `${ferramentas.length} ${ferramentas.length === 1 ? 'ferramenta' : 'ferramentas'}`}
        </span>
        <span className={styles.etapas}>
          {/* Com progresso, o número é a POSIÇÃO da pessoa (2/5). Sem, é o
              tamanho da empreitada (5 etapas) — dado do catálogo, não dela. */}
          {total > 0 && (emProgresso ? `${feitas}/${total} etapas` : `${total} etapas`)}
        </span>
      </footer>

      {/* A barra vive na BORDA do card, não numa faixa própria: ela é o estado do
          objeto, não uma seção dele. `scaleX` e não `width` — width dispara
          layout a cada frame; transform fica no compositor. */}
      {emProgresso && (
        <span className={styles.trilho} aria-hidden="true">
          <span
            className={styles.barra}
            style={{ transform: `scaleX(${percentual(feitas, total) / 100})` }}
          />
        </span>
      )}
    </Link>
  );
}
