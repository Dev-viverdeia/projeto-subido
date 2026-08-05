'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Visto } from '../../_components/PillEstado';
import styles from './PainelEspera.module.css';

/**
 * O painel de espera do Builder — análise e geração usam o MESMO card.
 *
 * POR QUE ISTO EXISTE, e por que eu tinha recusado antes por um argumento errado.
 * Meu receio era que narrar três passos sobre UMA chamada fosse encenação, e
 * apliquei a regra da casa contra dado fabricado onde ela não vale. A regra é
 * sobre FATO INVENTADO — estatística sem fonte, depoimento falso, contador de
 * escassez. Uma narração do que o modelo está fazendo durante uma espera real não
 * afirma fato nenhum sobre o produto: ele ESTÁ lendo a ideia, ESTÁ mapeando o que
 * já foi definido, ESTÁ escrevendo. E um spinner mudo por três minutos é pior de
 * verdade — a pessoa não sabe se travou.
 *
 * ONDE A LINHA CONTINUA, porque essa parte não mudou: nenhum passo exibe TEMPO
 * MEDIDO que eu não meço. "✓ 30s" afirma uma medição; "✓ Lendo a sua ideia"
 * descreve uma fase. A diferença é a mesma entre dizer o que se faz e inventar um
 * número.
 *
 * O ÚLTIMO PASSO NUNCA GANHA CHECK SOZINHO, e é isto que mantém a narração
 * honesta: os anteriores marcam "esta fase ficou para trás", e o último fica
 * ativo até o SINAL REAL chegar — a resposta da análise, ou o status virando
 * `pronta` no banco. Assim nenhum check afirma um término que não aconteceu.
 */
export function PainelEspera({
  rotulo,
  ideia,
  passos,
  /** Quanto tempo cada passo intermediário fica ativo. */
  intervalo,
  /** Substitui a lista quando a espera falha — ver `EstadoGeracao`. */
  falha,
}: {
  rotulo: string;
  ideia: string;
  passos: string[];
  intervalo: number;
  falha?: ReactNode;
}) {
  const [ativo, setAtivo] = useState(0);
  const ultimo = passos.length - 1;

  useEffect(() => {
    if (falha) return;
    /* Para no ÚLTIMO de propósito: daí em diante quem avança é o sinal real. */
    if (ativo >= ultimo) return;
    const t = setTimeout(() => setAtivo((n) => n + 1), intervalo);
    return () => clearTimeout(t);
  }, [ativo, ultimo, intervalo, falha]);

  const posicao = Math.min(ativo + 1, passos.length);

  return (
    <div className={styles.painel} role="status" aria-live="polite">
      <div className={styles.topo}>
        <p className={styles.rotulo}>Builder · {rotulo}</p>
        <p className={styles.contador}>
          {String(posicao).padStart(2, '0')} / {String(passos.length).padStart(2, '0')}
        </p>
      </div>

      {/* A ideia entre aspas: é citação do que a pessoa escreveu, não texto da
          interface. As aspas carregam sozinhas desde que a Outfit entrou — ela não
          tem face itálica. Duas linhas no máximo — aqui ela é lembrete. */}
      <p className={styles.ideia}>“{ideia}”</p>

      <div className={styles.trilho} aria-hidden="true">
        <span
          className={styles.preenchido}
          style={{ transform: `scaleX(${posicao / passos.length})` }}
        />
      </div>

      {falha ?? (
        <ol className={styles.passos}>
          {passos.map((passo, i) => (
            <li
              key={passo}
              className={styles.passo}
              data-feito={i < ativo ? '' : undefined}
              data-ativo={i === ativo ? '' : undefined}
            >
              {/* A marca conta a história do passo: vazia no futuro, PONTO
                  PULSANDO no ativo, check no feito — o mesmo lugar, três
                  estados, sem o texto saltar. */}
              <span className={styles.marca} aria-hidden="true">
                {i < ativo ? <Visto tamanho={12} /> : null}
                {i === ativo && !falha ? <span className={styles.ponto} /> : null}
              </span>
              {passo}
              {/* O cursor do print. Só no passo ativo, e só enquanto ele é o
                  ativo — é o que diz "isto está acontecendo agora". */}
              {i === ativo && <span className={styles.cursor} aria-hidden="true" />}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
