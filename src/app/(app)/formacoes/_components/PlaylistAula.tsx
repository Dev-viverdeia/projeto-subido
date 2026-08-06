'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Button, Drawer } from '@/design-system/via';
import type { FormacaoCompleta } from '@/lib/conteudo/queries';
import { TrilhoProgresso } from '../../_components/TrilhoProgresso';
import { formatarDuracao } from '../../_components/tempo';
import { useCurriculo } from './useCurriculo';
import styles from './PlaylistAula.module.css';

/**
 * A playlist do curso na tela da aula. Desktop: painel sticky ao lado do player
 * (módulos single-open — diferente do detalhe do curso, onde vários abrem: aqui
 * o espaço é um trilho). Mobile: o painel some e vira `Drawer`.
 *
 * O módulo da aula ATUAL abre sozinho quando a rota muda, e a linha atual entra
 * na área visível — respeitando reduced-motion no scroll.
 *
 * SEM "VOCÊ ESTÁ AQUI" AQUI, e a razão é de significado, não de espaço. No
 * currículo do curso esse marcador quer dizer "a próxima aula não assistida"; na
 * playlist, a aula em foco é a que está ABERTA, que pode ser qualquer uma —
 * inclusive uma revisão. O mesmo selo com dois sentidos, nas duas listas do mesmo
 * curso, ensina a pessoa a desconfiar dele. A aula aberta já é marcada por
 * `aria-current="page"` e por `data-atual`, que é o que ela significa.
 */
function Painel({ formacao, aulaAtualId }: { formacao: FormacaoCompleta; aulaAtualId: string }) {
  const curriculo = useCurriculo(formacao);
  const moduloDaAtual =
    formacao.modulos.find((m) => m.aulas.some((a) => a.id === aulaAtualId))?.id ?? null;

  /* Aberto DERIVADO: a escolha manual guarda a aula sob a qual foi feita. Rota
     mudou → assinatura não bate → volta a valer o módulo da aula atual, no mesmo
     render (um efeito com setState mostraria o módulo errado por um frame, e o
     lint reprova o setState síncrono em efeito). */
  const [escolha, setEscolha] = useState<{ aulaId: string; aberto: string | null }>({
    aulaId: aulaAtualId,
    aberto: moduloDaAtual,
  });
  const aberto = escolha.aulaId === aulaAtualId ? escolha.aberto : moduloDaAtual;
  const setAberto = (m: string | null) => setEscolha({ aulaId: aulaAtualId, aberto: m });
  const linhaAtualRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    linhaAtualRef.current?.scrollIntoView({
      block: 'center',
      behavior: reduzir ? 'auto' : 'smooth',
    });
  }, [aulaAtualId]);

  return (
    <div className={styles.painel}>
      {/* O MESMO trilho do curso, na variante densa. Aqui existiam um `Progress`
          do DS, um eyebrow com outro nome ("Progresso do curso") e uma contagem
          própria — uma TERCEIRA maneira de desenhar o número que o curso e o
          catálogo já desenhavam de dois jeitos. */}
      <div className={styles.topo}>
        <TrilhoProgresso
          itens={curriculo.planas}
          feitasIds={curriculo.feitasIds}
          proximo={curriculo.proxima}
          unidade={{ singular: 'aula', plural: 'aulas' }}
          denso
        />
      </div>

      <div className={styles.modulos}>
        {curriculo.modulos.map(({ modulo, aulas }, indice) => {
          const estaAberto = aberto === modulo.id;
          return (
            <section key={modulo.id} className={styles.modulo}>
              <button
                type="button"
                className={styles.gatilho}
                aria-expanded={estaAberto}
                onClick={() => setAberto(estaAberto ? null : modulo.id)}
              >
                <span className={styles.numero}>{String(indice + 1).padStart(2, '0')}</span>
                <span className={styles.nomeModulo}>{modulo.titulo}</span>
                <svg
                  className={styles.chevron}
                  data-aberto={estaAberto ? '' : undefined}
                  width="12"
                  height="12"
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="m3 5 4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>

              <div className={styles.dobra} data-aberto={estaAberto ? '' : undefined}>
                <div className={styles.aulas} inert={!estaAberto}>
                  {aulas.map(({ aula, status }) => {
                    const atual = aula.id === aulaAtualId;
                    const duracao = formatarDuracao(aula.duracao_seg);
                    return (
                      <Link
                        key={aula.id}
                        ref={atual ? linhaAtualRef : undefined}
                        href={`/formacoes/${formacao.slug}/aula/${aula.id}`}
                        className={styles.linha}
                        data-atual={atual ? '' : undefined}
                        data-status={status}
                        aria-current={atual ? 'page' : undefined}
                      >
                        <span
                          className={styles.pontoStatus}
                          data-status={status}
                          aria-hidden="true"
                        />
                        <span className={styles.tituloAula}>{aula.titulo}</span>
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
    </div>
  );
}

export function PlaylistAula({
  formacao,
  aulaAtualId,
}: {
  formacao: FormacaoCompleta;
  aulaAtualId: string;
}) {
  const [drawerAberto, setDrawerAberto] = useState(false);

  return (
    <>
      <aside className={styles.lateral} aria-label="Aulas do curso">
        <Painel formacao={formacao} aulaAtualId={aulaAtualId} />
      </aside>

      <div className={styles.movel}>
        <Button variant="secondary" fullWidth onClick={() => setDrawerAberto(true)}>
          Ver as aulas do curso
        </Button>
        <Drawer
          open={drawerAberto}
          onClose={() => setDrawerAberto(false)}
          side="right"
          title="Aulas do curso"
        >
          <Painel formacao={formacao} aulaAtualId={aulaAtualId} />
        </Drawer>
      </div>
    </>
  );
}
