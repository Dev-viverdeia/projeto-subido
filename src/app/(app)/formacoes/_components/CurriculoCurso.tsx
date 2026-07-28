'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { ModuloDoCurriculo, StatusAula } from './useCurriculo';
import { formatarDuracao } from '../../_components/tempo';
import styles from './CurriculoCurso.module.css';

/**
 * O currículo em módulos expansíveis — accordion CUSTOM, não o do DS: aqui são
 * múltiplos abertos ao mesmo tempo, o painel carrega conteúdo interativo e a
 * animação é `grid-template-rows: 0fr → 1fr` (anima altura sem `height: auto`).
 * O painel fechado recebe `inert` — os links saem do tab-order sem matar a
 * transição de fechamento.
 */
function IconeStatus({ status }: { status: StatusAula }) {
  if (status === 'concluida') {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <circle cx="9" cy="9" r="8" fill="var(--via-navy)" />
        <path
          d="m5.6 9.2 2.2 2.2 4.4-4.8"
          stroke="var(--via-white)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    );
  }
  if (status === 'atual') {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="9" cy="9" r="7.25" stroke="var(--via-navy)" strokeWidth="1.5" />
        <path d="m7.4 6.2 4 2.8-4 2.8z" fill="var(--via-navy)" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="7.25" stroke="var(--via-border)" strokeWidth="1.5" />
    </svg>
  );
}

export function CurriculoCurso({
  formacaoSlug,
  modulos,
  moduloAbertoInicial,
}: {
  formacaoSlug: string;
  modulos: ModuloDoCurriculo[];
  moduloAbertoInicial: string | null;
}) {
  const [abertos, setAbertos] = useState<string[]>(() =>
    moduloAbertoInicial ? [moduloAbertoInicial] : modulos[0] ? [modulos[0].modulo.id] : [],
  );

  const alternar = (id: string) =>
    setAbertos((atual) => (atual.includes(id) ? atual.filter((m) => m !== id) : [...atual, id]));

  return (
    <div className={styles.lista}>
      {modulos.map(({ modulo, aulas, feitas, completo }, indice) => {
        const aberto = abertos.includes(modulo.id);
        const idPainel = `modulo-${modulo.id}`;
        const idGatilho = `gatilho-${modulo.id}`;

        return (
          <section key={modulo.id} className={styles.modulo}>
            <h3 className={styles.moduloTitulo}>
              <button
                type="button"
                id={idGatilho}
                className={styles.gatilho}
                aria-expanded={aberto}
                aria-controls={idPainel}
                onClick={() => alternar(modulo.id)}
              >
                <span className={styles.numero} aria-hidden="true">
                  {String(indice + 1).padStart(2, '0')}
                </span>
                <span className={styles.nome}>{modulo.titulo}</span>
                <span className={styles.metaModulo}>
                  {feitas}/{aulas.length}
                  {completo && (
                    <svg width="14" height="14" viewBox="0 0 18 18" aria-hidden="true">
                      <circle cx="9" cy="9" r="8" fill="var(--via-navy)" />
                      <path
                        d="m5.6 9.2 2.2 2.2 4.4-4.8"
                        stroke="var(--via-white)"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        fill="none"
                      />
                    </svg>
                  )}
                </span>
                <svg
                  className={styles.chevron}
                  data-aberto={aberto ? '' : undefined}
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="m3 5 4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </h3>

            <div className={styles.dobra} data-aberto={aberto ? '' : undefined}>
              <div
                id={idPainel}
                role="region"
                aria-labelledby={idGatilho}
                className={styles.painel}
                inert={!aberto}
              >
                {aulas.map(({ aula, status }) => {
                  const duracao = formatarDuracao(aula.duracao_seg);
                  return (
                    <Link
                      key={aula.id}
                      href={`/formacoes/${formacaoSlug}/aula/${aula.id}`}
                      className={styles.aula}
                      data-status={status}
                      aria-current={status === 'atual' ? 'true' : undefined}
                    >
                      <IconeStatus status={status} />
                      <span className={styles.aulaTitulo}>{aula.titulo}</span>
                      {duracao && <span className={styles.duracao}>{duracao}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
