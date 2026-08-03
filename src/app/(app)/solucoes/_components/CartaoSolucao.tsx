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
import { iniciais } from './iniciais';
import { PillEstado } from './PillEstado';
import styles from './CartaoSolucao.module.css';

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
  /* Três marcas no máximo: a quarta empurraria a contagem escrita para fora da
     linha nos cards de 340px. O número ao lado continua dizendo o total. */
  const visiveis = ferramentas.slice(0, 3);

  const total = solucao.etapaIds.length;
  const feitas = contarEtapasFeitas(progresso, solucao.etapaIds);
  const estado = estadoDaSolucao(feitas, total);
  /* `nao-iniciada` PASSOU A APARECER. Antes ficava escondida com o argumento de
     que uma pill igual em todo card seria ruído — mas escondê-la deixava o card
     sem coluna de estado até a primeira marcação, e a grade lia como duas
     famílias de card diferentes. Com as três variantes visíveis, o estado é uma
     posição fixa que o olho aprende uma vez. Quem decide o que é exibível é o
     `PillEstado`, o MESMO selo que a ficha usa — antes havia uma cópia aqui, e
     duas cópias divergem justamente na transição catálogo → detalhe. */
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

        <PillEstado estado={estado} className={styles.selo} />
      </div>

      <h3 className={styles.titulo}>{solucao.titulo}</h3>
      {solucao.resumo && <p className={styles.resumo}>{solucao.resumo}</p>}

      <span className={styles.vao} />
      <hr className={styles.fio} />

      <footer className={styles.rodape}>
        <span className={styles.contagens}>
          {visiveis.length > 0 && (
            <span className={styles.marcas}>
              {visiveis.map((f) => (
                <span key={f} className={styles.marca} title={f} aria-hidden="true">
                  {iniciais(f)}
                </span>
              ))}
              {/* As marcas são decorativas — quem carrega o significado para o
                  leitor de tela é a contagem escrita logo ao lado, mais os nomes
                  completos na ficha. Repetir "WB, N8, CL" em voz alta não
                  informaria nada. */}
            </span>
          )}
          {ferramentas.length > 0 &&
            `${ferramentas.length} ${ferramentas.length === 1 ? 'ferramenta' : 'ferramentas'}`}
        </span>
        <span className={styles.etapas}>
          {/* Com progresso, o número é a POSIÇÃO da pessoa (2/5). Sem, é o
              tamanho da empreitada (5 etapas) — dado do catálogo, não dela.
              O singular importa: uma solução de uma etapa dizia "1 etapas". */}
          {total > 0 &&
            (emProgresso
              ? `${feitas}/${total} etapas`
              : `${total} ${total === 1 ? 'etapa' : 'etapas'}`)}
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
