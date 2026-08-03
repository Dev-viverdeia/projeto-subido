'use client';

import type { ItemSolucao } from '@/lib/conteudo/queries';
import { alternarEtapa, contarEtapasFeitas, percentual, useProgresso } from '@/lib/progresso/local';
import styles from './PassoAPasso.module.css';

/**
 * O passo a passo da solução — lista numerada EDITORIAL, agora marcável.
 *
 * A plataforma de referência abandonou o passo a passo por não ter o dado; aqui
 * `solucao_itens` tipo `etapa` existe e é o diferencial da tela.
 *
 * POR QUE VIROU CLIENT COMPONENT
 * Marcar etapa é o que alimenta o estado no catálogo — sem esta tela, "em
 * andamento" e "2/5 etapas" lá seriam número inventado. O custo é este arquivo
 * sair do servidor; ele não importa ícone nenhum, então não arrasta biblioteca.
 *
 * O CHECKBOX É O CONTROLE, não um `<div role="checkbox">`. Espaço alterna, o
 * leitor de tela anuncia o estado, e o rótulo é clicável porque é um `<label>` de
 * verdade. Reimplementar isso à mão custaria três atributos ARIA para chegar ao
 * mesmo lugar.
 *
 * PROGRESSO DESTE NAVEGADOR — a mesma limitação das aulas, dita no `local.ts`.
 * Some quando a tabela existir; a API daqui não muda.
 */
export function PassoAPasso({ etapas, slug }: { etapas: ItemSolucao[]; slug: string }) {
  const progresso = useProgresso();

  if (etapas.length === 0) return null;

  const ids = etapas.map((e) => e.id);
  const feitas = contarEtapasFeitas(progresso, ids);

  return (
    <section aria-labelledby="passo-a-passo-titulo" className={styles.secao}>
      <div className={styles.cabecalho}>
        <h2 id="passo-a-passo-titulo" className={styles.eyebrow}>
          Passo a passo
          <span className={styles.total}>{etapas.length}</span>
        </h2>

        {/* A contagem só aparece depois da primeira marcação: "0 de 5 feitas" em
            toda solução que a pessoa nunca abriu é ruído com cara de dado. */}
        {feitas > 0 && (
          <p className={styles.progresso} aria-live="polite">
            <span className={styles.feitas}>{feitas}</span> de {etapas.length} feitas ·{' '}
            {percentual(feitas, etapas.length)}%
          </p>
        )}
      </div>

      <ol className={styles.lista}>
        {etapas.map((etapa, i) => {
          const feita = Boolean(progresso.etapas[etapa.id]);
          const idCampo = `etapa-${etapa.id}`;

          return (
            <li key={etapa.id} className={styles.passo} data-feita={feita ? '' : undefined}>
              <input
                type="checkbox"
                id={idCampo}
                className={styles.marca}
                checked={feita}
                onChange={() => alternarEtapa(etapa.id, slug)}
              />

              {/* O NÚMERO É O RÓTULO do checkbox: vira o alvo de clique sem
                  inventar um segundo controle ao lado dele, e a área de toque
                  passa a ser os 36px da coluna em vez dos 16 da caixa. */}
              <label className={styles.numero} htmlFor={idCampo}>
                <span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <span className="sr-only">
                  Marcar a etapa {i + 1} como feita: {etapa.titulo}
                </span>
              </label>

              <div className={styles.corpo}>
                <h3 className={styles.tituloPasso}>{etapa.titulo}</h3>
                {etapa.conteudo && <p className={styles.texto}>{etapa.conteudo}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
