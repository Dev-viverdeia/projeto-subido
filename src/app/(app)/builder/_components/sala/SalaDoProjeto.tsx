'use client';

import { useState, type ReactNode } from 'react';
import type { SolucaoBuilder } from '@/lib/builder/queries';
import { Visto } from '../../../_components/PillEstado';
import { ETAPAS, contarTarefas, etapaInicial, motivoDoCadeado, type IdEtapa } from './etapas';
import entrada from '../../../_components/entrada.module.css';
import styles from './SalaDoProjeto.module.css';

/**
 * A SALA DO PROJETO — o Builder deixa de ser um documento e vira um percurso.
 *
 * O QUE MUDOU DE CONCEITO. A tela anterior entregava a ficha inteira de uma vez:
 * viabilidade, arquitetura, ferramentas, etapas, prompts e riscos, tudo numa
 * rolagem só. Estava correta e era ilegível como PLANO — a pessoa saía com um
 * documento, não com um próximo passo. A sala quebra o mesmo material em quatro
 * momentos, e cada um responde uma pergunta diferente: o que é isto, o que vou
 * usar, por onde começo, o que falta.
 *
 * O TRAVAMENTO É DERIVADO DO DADO, nunca gravado — ver `etapas.ts`. E cada
 * cadeado DIZ o motivo: um ícone de cadeado sem frase é a interface informando
 * que a pessoa não pode e escondendo por quê.
 *
 * O PROGRESSO DO HERO É REAL. São as etapas do documento marcadas como `feito` no
 * kanban, contadas do banco. Enquanto não houver documento não há denominador, e
 * o hero mostra o status em vez de um `0 / 0` que finge medir.
 */
export function SalaDoProjeto({
  solucao,
  criacao,
  entender,
  kit,
  construir,
}: {
  solucao: SolucaoBuilder;
  /* Os quatro painéis chegam prontos do servidor: assim o documento inteiro não
     precisa atravessar a fronteira como prop serializada. */
  criacao: ReactNode;
  entender: ReactNode;
  kit: ReactNode;
  construir: ReactNode;
}) {
  const [etapa, setEtapa] = useState<IdEtapa>(() => etapaInicial(solucao));
  const { feitas, total } = contarTarefas(solucao);

  const paineis: Record<IdEtapa, ReactNode> = { criacao, entender, kit, construir };
  const indice = ETAPAS.findIndex((e) => e.id === etapa);
  const atual = ETAPAS[indice] ?? ETAPAS[0]!;
  const cadeadoAtual = motivoDoCadeado(etapa, solucao);

  /* O AVANÇO EXPLÍCITO, que o stepper sozinho não dá. Clicar num degrau é
     navegação; terminar uma etapa e seguir é conclusão, e são gestos diferentes.
     Só existe quando a próxima está DESTRAVADA — um "continuar" que esbarra num
     cadeado é a promessa que a etapa acabou de negar. */
  const proxima = ETAPAS[indice + 1];
  const podeAvancar = proxima && motivoDoCadeado(proxima.id, solucao) === null;

  return (
    <div className={styles.sala}>
      <header className={`${styles.hero} via-noise`}>
        <div className={styles.heroTexto}>
          <p className={styles.eyebrow}>Builder · Sala do projeto</p>
          <h1 className={styles.titulo}>{solucao.titulo || solucao.ideiaOriginal}</h1>
          <p className={styles.resumo}>
            {solucao.documento
              ? 'Você é o gerente deste projeto — siga as etapas.'
              : 'Assim que a criação terminar, o plano completo abre aqui.'}
          </p>
        </div>

        {/* Só existe medida quando existe documento. Sem ele, `0 / 0` seria um
            medidor fingindo medir. */}
        {total > 0 && (
          <div className={styles.medida}>
            <p className={styles.contagem}>
              {feitas} / {total} tarefas
            </p>
            <div className={styles.trilho} aria-hidden="true">
              <span
                className={styles.preenchido}
                style={{ transform: `scaleX(${total === 0 ? 0 : feitas / total})` }}
              />
            </div>
          </div>
        )}
      </header>

      {/* O STEPPER É UMA TABLIST de verdade: as setas do teclado funcionam porque
          o papel promete isso. Etapa travada continua no tab-order e anuncia o
          motivo — esconder o degrau faria a pessoa perder a noção do percurso. */}
      <div role="tablist" aria-label="Etapas do projeto" className={styles.stepper}>
        {ETAPAS.map((e, i) => {
          const travada = motivoDoCadeado(e.id, solucao) !== null;
          const concluida = !travada && ETAPAS.findIndex((x) => x.id === etapa) > i;
          const ativa = e.id === etapa;

          return (
            <button
              key={e.id}
              role="tab"
              type="button"
              aria-selected={ativa}
              aria-disabled={travada}
              className={styles.degrau}
              data-ativa={ativa ? '' : undefined}
              data-travada={travada ? '' : undefined}
              onClick={() => !travada && setEtapa(e.id)}
            >
              <span className={styles.marcador} aria-hidden="true">
                {concluida ? <Visto tamanho={13} /> : travada ? <Cadeado /> : e.numero.slice(1)}
              </span>
              <span className={styles.degrauRotulo}>{e.rotulo}</span>
            </button>
          );
        })}
      </div>

      {/* `key` na etapa: mudar de degrau remonta o painel, e o remonte é o que
          dispara a entrada — ver `entrada.troca`. */}
      <section key={etapa} className={`${styles.painel} ${entrada.troca}`} aria-live="polite">
        <p className={styles.painelEyebrow}>
          <span className={styles.painelNumero} aria-hidden="true">
            {atual.numero}
          </span>
          {atual.rotulo}
        </p>

        {cadeadoAtual ? (
          <p className={styles.travado}>
            <Cadeado />
            {cadeadoAtual}
          </p>
        ) : (
          paineis[etapa]
        )}

        {!cadeadoAtual && podeAvancar && proxima && (
          <div className={styles.avancoLinha}>
            <button type="button" className={styles.avanco} onClick={() => setEtapa(proxima.id)}>
              {proxima.id === 'construir' ? 'Começar a construir' : `Ir para ${proxima.rotulo}`}
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
          </div>
        )}
      </section>
    </div>
  );
}

function Cadeado() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.75 7V5.25a2.25 2.25 0 1 1 4.5 0V7" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
