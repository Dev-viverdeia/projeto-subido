'use client';

import {
  contarConcluidas,
  contarEtapasFeitas,
  estadoDoProgresso,
  useProgresso,
} from '@/lib/progresso/local';
import styles from './FatosLocais.module.css';

/**
 * A linha de fatos do hero: três números reais do progresso local, em mono
 * sobre a navy. Client porque o dado é do navegador; o SSR chega com zeros e
 * o cliente corrige na hidratação — o custo honesto do progresso local.
 */
export function FatosLocais({
  aulaIdsPorFormacao,
  etapaIdsPorSolucao,
}: {
  aulaIdsPorFormacao: string[][];
  etapaIdsPorSolucao: string[][];
}) {
  const progresso = useProgresso();

  const aulas = contarConcluidas(progresso, aulaIdsPorFormacao.flat());
  const etapas = contarEtapasFeitas(progresso, etapaIdsPorSolucao.flat());
  const certificados =
    aulaIdsPorFormacao.filter(
      (ids) => estadoDoProgresso(contarConcluidas(progresso, ids), ids.length) === 'concluida',
    ).length +
    etapaIdsPorSolucao.filter(
      (ids) => estadoDoProgresso(contarEtapasFeitas(progresso, ids), ids.length) === 'concluida',
    ).length;

  const fatos = [
    { n: aulas, rotulo: aulas === 1 ? 'aula concluída' : 'aulas concluídas' },
    { n: etapas, rotulo: etapas === 1 ? 'etapa implementada' : 'etapas implementadas' },
    { n: certificados, rotulo: certificados === 1 ? 'certificado' : 'certificados' },
  ];

  return (
    <p className={styles.fatos}>
      {fatos.map((f, i) => (
        <span key={f.rotulo} className={styles.fato}>
          {i > 0 && (
            <span className={styles.divisor} aria-hidden="true">
              ·
            </span>
          )}
          <span className={styles.numero}>{f.n}</span> {f.rotulo}
        </span>
      ))}
    </p>
  );
}
