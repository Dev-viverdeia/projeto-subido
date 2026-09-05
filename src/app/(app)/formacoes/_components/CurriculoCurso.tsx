'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BookOpen, Check } from 'lucide-react';
import type { ModuloDoCurriculo, StatusAula } from './useCurriculo';
import { formatarDuracao } from '../../_components/tempo';
import styles from './CurriculoCurso.module.css';

/**
 * O currículo em módulos expansíveis — accordion CUSTOM, não o do DS: aqui são
 * múltiplos abertos ao mesmo tempo. O painel fechado recebe `inert`, retirando
 * seus links do teclado. A expansão não anima o layout.
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
  /**
   * ABERTO DERIVADO, e o inicializador de `useState` era um BUG de hidratação.
   *
   * `moduloAbertoInicial` sai do progresso da conta e muda assim que uma aula é
   * marcada. Um inicializador de `useState` roda UMA vez e congelaria o módulo
   * anterior depois dessa mudança — a pessoa concluiria a aula, mas o currículo
   * continuaria aberto no lugar errado.
   *
   * A correção é a mesma que a `PlaylistAula` já usa: o estado guarda a ESCOLHA
   * explícita junto da assinatura sob a qual ela foi feita. Assinatura mudou →
   * volta a valer o derivado, no MESMO render. Um `useEffect` sincronizando isso
   * mostraria o módulo errado por um frame, e o lint de hooks reprova o setState
   * síncrono em efeito — com razão.
   */
  const padrao = moduloAbertoInicial ?? modulos[0]?.modulo.id ?? null;
  const [escolha, setEscolha] = useState<{ assinatura: string | null; abertos: string[] } | null>(
    null,
  );
  const abertos =
    escolha && escolha.assinatura === padrao ? escolha.abertos : padrao ? [padrao] : [];

  const alternar = (id: string) =>
    setEscolha({
      assinatura: padrao,
      abertos: abertos.includes(id) ? abertos.filter((m) => m !== id) : [...abertos, id],
    });

  return (
    <div className={styles.lista}>
      {modulos.map(({ modulo, aulas, feitas, completo }) => {
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
                <span
                  className={styles.iconeModulo}
                  data-completo={completo || undefined}
                  aria-hidden="true"
                >
                  {completo ? <Check size={18} /> : <BookOpen size={18} />}
                </span>
                <span className={styles.nome}>{modulo.titulo}</span>
                <span className={styles.metaModulo}>
                  {completo
                    ? 'Concluído'
                    : `${feitas} de ${aulas.length} ${aulas.length === 1 ? 'aula' : 'aulas'}`}
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
                    >
                      <IconeStatus status={status} />
                      <span className={styles.aulaTitulo}>{aula.titulo}</span>
                      {status === 'concluida' && (
                        <span className={styles.srOnly}>Aula concluída.</span>
                      )}
                      {status === 'atual' && <span className={styles.proxima}>Próxima aula</span>}
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
