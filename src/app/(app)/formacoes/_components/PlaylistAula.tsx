'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Check, Play, Circle } from 'lucide-react';
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
function Painel({
  formacao,
  aulaAtualId,
  onEscolher,
}: {
  formacao: FormacaoCompleta;
  aulaAtualId: string;
  onEscolher?: () => void;
}) {
  const curriculo = useCurriculo(formacao);
  const painelId = useId();
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
  const painelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Não desfaz a escolha de quem abriu outro módulo para revisar uma aula.
    if (aberto !== moduloDaAtual) return;
    const painel =
      painelRef.current?.closest<HTMLElement>('.via-drawer__body') ?? painelRef.current;
    const linha = linhaAtualRef.current;
    if (!painel?.clientHeight || !linha?.getClientRects().length) return;
    const area = painel.getBoundingClientRect();
    const item = linha.getBoundingClientRect();
    // Rola apenas a playlist. scrollIntoView também move a página e esconde o vídeo.
    if (item.top < area.top || item.bottom > area.bottom) {
      painel.scrollTop += item.top - area.top - (painel.clientHeight - item.height) / 2;
    }
  }, [aulaAtualId, aberto, moduloDaAtual]);

  return (
    <div className={styles.painel}>
      <header className={styles.cabecalhoPainel}>
        <h2>
          <Link href={`/formacoes/${formacao.slug}`} className={styles.voltarCurso}>
            {formacao.titulo}
          </Link>
        </h2>
        <TrilhoProgresso
          itens={curriculo.planas}
          feitasIds={curriculo.feitasIds}
          proximo={curriculo.proxima}
          unidade={{ singular: 'aula', plural: 'aulas' }}
          denso
        />
      </header>

      <div className={styles.modulos} ref={painelRef}>
        {curriculo.modulos.map(({ modulo, aulas, completo }) => {
          const estaAberto = aberto === modulo.id;
          const gatilhoId = `${painelId}-gatilho-${modulo.id}`;
          const aulasId = `${painelId}-aulas-${modulo.id}`;
          return (
            <section key={modulo.id} className={styles.modulo}>
              <button
                id={gatilhoId}
                type="button"
                className={styles.gatilho}
                aria-expanded={estaAberto}
                aria-controls={aulasId}
                onClick={() => setAberto(estaAberto ? null : modulo.id)}
              >
                <span
                  className={styles.iconeModulo}
                  data-completo={completo ? '' : undefined}
                  aria-hidden="true"
                >
                  {completo ? <Check size={16} /> : <BookOpen size={18} />}
                </span>
                <span className={styles.nomeModulo}>{modulo.titulo}</span>
                {completo && <span className="sr-only">Módulo concluído.</span>}
                <svg
                  className={styles.chevron}
                  data-aberto={estaAberto ? '' : undefined}
                  width="16"
                  height="16"
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
                <div
                  id={aulasId}
                  className={styles.aulas}
                  role="region"
                  aria-labelledby={gatilhoId}
                  inert={!estaAberto}
                >
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
                        onClick={onEscolher}
                      >
                        <span
                          className={styles.pontoStatus}
                          data-status={status}
                          data-atual={atual ? '' : undefined}
                          aria-hidden="true"
                        >
                          {status === 'concluida' ? (
                            <Check size={16} />
                          ) : atual ? (
                            <Play size={15} />
                          ) : (
                            <Circle size={12} />
                          )}
                        </span>
                        <span className={styles.tituloAula}>{aula.titulo}</span>
                        {status === 'concluida' && <span className="sr-only">Aula concluída.</span>}
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
        <Button
          variant="secondary"
          fullWidth
          aria-expanded={drawerAberto}
          aria-haspopup="dialog"
          onClick={(event) => {
            // Safari não foca botões ao tocar. Registre o ponto de retorno antes do Drawer.
            event.currentTarget.focus();
            setDrawerAberto(true);
          }}
        >
          Ver as aulas do curso
        </Button>
        {drawerAberto &&
          createPortal(
            <div className={styles.portal}>
              <Drawer
                open={drawerAberto}
                onClose={() => setDrawerAberto(false)}
                side="right"
                title="Aulas do curso"
              >
                <Painel
                  formacao={formacao}
                  aulaAtualId={aulaAtualId}
                  onEscolher={() => setDrawerAberto(false)}
                />
              </Drawer>
            </div>,
            document.body,
          )}
      </div>
    </>
  );
}
