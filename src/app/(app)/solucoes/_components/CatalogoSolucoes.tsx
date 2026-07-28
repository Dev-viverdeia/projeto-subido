'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Button, EmptyState, Pagination } from '@/design-system/via';
import type { SolucaoResumo } from '@/lib/conteudo/queries';
import { AbasFiltro } from '../../_components/filtros/AbasFiltro';
import { BuscaCatalogo } from '../../_components/filtros/BuscaCatalogo';
import { ChipsAtivos } from '../../_components/filtros/ChipsAtivos';
import { PainelMaisFiltros } from '../../_components/filtros/PainelMaisFiltros';
import { useDebounce } from '../../_components/filtros/useDebounce';
import { atualizarUrlFiltros, type FiltrosIniciais } from '../../_components/filtros/urlFiltros';
import { CartaoSolucao } from './CartaoSolucao';
import styles from './CatalogoSolucoes.module.css';

const POR_PAGINA = 12;
const TODAS = 'todas';

/** Sem acento e minúsculo — "automação" encontra "automacao" e vice-versa. */
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * A ilha de descoberta do catálogo. Recebe a lista COMPLETA do RSC e filtra,
 * ordena e pagina em memória — no tamanho deste catálogo, é resposta imediata a
 * cada tecla sem uma query nova por interação.
 *
 * O estado nasce de `filtrosIniciais` (lidos de `searchParams` no servidor), o
 * que faz o HTML do deep-link chegar JÁ filtrado — sem mismatch de hidratação.
 * Depois disso a URL é espelho, não fonte: `history.replaceState` raso.
 */
export function CatalogoSolucoes({
  solucoes,
  icones,
  iconePadrao,
  filtrosIniciais,
}: {
  solucoes: SolucaoResumo[];
  icones: Record<string, ReactNode>;
  iconePadrao: ReactNode;
  filtrosIniciais: FiltrosIniciais;
}) {
  const [busca, setBusca] = useState(filtrosIniciais.q);
  const [categoria, setCategoria] = useState(filtrosIniciais.categoria || TODAS);
  const [ferramentasSel, setFerramentasSel] = useState<string[]>(filtrosIniciais.ferramentas);
  const [ordem, setOrdem] = useState<'recentes' | 'alfabetica'>(filtrosIniciais.ordem);

  const buscaLenta = useDebounce(busca, 400);
  const reduzir = useReducedMotion();
  const topoGradeRef = useRef<HTMLDivElement>(null);

  /* Página DERIVADA, não efeito: a página guarda a assinatura dos filtros sob a
     qual foi escolhida. Filtro mudou → assinatura não bate → volta à 1ª, no MESMO
     render. Um efeito com setPagina(1) renderizaria a página errada por um frame
     (e o lint de hooks reprova o setState síncrono em efeito, com razão). */
  const assinaturaFiltros = `${buscaLenta}|${categoria}|${ferramentasSel.join('~')}|${ordem}`;
  const [paginaEscolhida, setPaginaEscolhida] = useState({ assinatura: assinaturaFiltros, n: 1 });
  const pagina = paginaEscolhida.assinatura === assinaturaFiltros ? paginaEscolhida.n : 1;
  const setPagina = (n: number) => setPaginaEscolhida({ assinatura: assinaturaFiltros, n });

  /* Espelha na URL. O guard `busca !== buscaLenta` evita a corrida do deep-link:
     sem ele, o primeiro ciclo roda com o debounced ainda vazio e apaga o `?q=`. */
  const primeiraEscrita = useRef(true);
  useEffect(() => {
    if (busca !== buscaLenta) return;
    if (primeiraEscrita.current) {
      primeiraEscrita.current = false;
      return;
    }
    atualizarUrlFiltros({
      q: buscaLenta || null,
      categoria: categoria === TODAS ? null : categoria,
      f: ferramentasSel.length ? ferramentasSel.join('~') : null,
      ordem: ordem === 'recentes' ? null : ordem,
    });
  }, [busca, buscaLenta, categoria, ferramentasSel, ordem]);

  const abas = useMemo(() => {
    const vistas: string[] = [];
    for (const s of solucoes) {
      if (s.categoria && !vistas.includes(s.categoria)) vistas.push(s.categoria);
    }
    return [{ id: TODAS, rotulo: 'Todas' }, ...vistas.map((c) => ({ id: c, rotulo: c }))];
  }, [solucoes]);

  const facetasFerramentas = useMemo(() => {
    const contagem = new Map<string, number>();
    for (const s of solucoes) {
      for (const f of s.ferramentas) contagem.set(f, (contagem.get(f) ?? 0) + 1);
    }
    return [...contagem.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'))
      .map(([nome, total]) => ({ id: nome, rotulo: nome, total }));
  }, [solucoes]);

  /* Corpus de busca pré-normalizado — uma vez por lista, não por tecla. */
  const corpus = useMemo(
    () =>
      new Map(
        solucoes.map((s) => [
          s.id,
          {
            titulo: normalizar(s.titulo),
            categoria: normalizar(s.categoria ?? ''),
            resumo: normalizar(s.resumo ?? ''),
            ferramentas: normalizar(s.ferramentas.join(' ')),
          },
        ]),
      ),
    [solucoes],
  );

  const filtradas = useMemo(() => {
    let lista = solucoes;

    if (categoria !== TODAS) lista = lista.filter((s) => s.categoria === categoria);

    if (ferramentasSel.length > 0) {
      lista = lista.filter((s) => ferramentasSel.some((f) => s.ferramentas.includes(f)));
    }

    const termos = normalizar(buscaLenta).split(/\s+/).filter(Boolean);
    if (termos.length > 0) {
      /* Multi-palavra em E; ranking por peso de campo (título > ferramenta >
         categoria > resumo). Empate preserva a ordem editorial do banco. */
      const pontuadas = lista
        .map((s) => {
          const doc = corpus.get(s.id);
          if (!doc) return { s, pontos: 0 };
          let pontos = 0;
          for (const termo of termos) {
            const acerto =
              (doc.titulo.includes(termo) ? 4 : 0) +
              (doc.ferramentas.includes(termo) ? 3 : 0) +
              (doc.categoria.includes(termo) ? 2 : 0) +
              (doc.resumo.includes(termo) ? 1 : 0);
            if (acerto === 0) return { s, pontos: 0 };
            pontos += acerto;
          }
          return { s, pontos };
        })
        .filter(({ pontos }) => pontos > 0);
      pontuadas.sort((a, b) => b.pontos - a.pontos);
      lista = pontuadas.map(({ s }) => s);
    }

    if (ordem === 'alfabetica') {
      lista = [...lista].sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'));
    }

    return lista;
  }, [solucoes, categoria, ferramentasSel, buscaLenta, corpus, ordem]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaVisivel = Math.min(pagina, totalPaginas);
  const visiveis = filtradas.slice((paginaVisivel - 1) * POR_PAGINA, paginaVisivel * POR_PAGINA);

  const haFiltro = buscaLenta !== '' || categoria !== TODAS || ferramentasSel.length > 0;

  const limparTudo = () => {
    setBusca('');
    setCategoria(TODAS);
    setFerramentasSel([]);
  };

  /* Stagger em duas velocidades (regra da referência): a primeira carga espera a
     cascata da página; resposta a filtro é imediata. Estado virado DENTRO de um
     rAF — ler ref durante o render é proibido pelo lint de hooks. */
  const [aquecido, setAquecido] = useState(false);
  useEffect(() => {
    const quadro = requestAnimationFrame(() => setAquecido(true));
    return () => cancelAnimationFrame(quadro);
  }, []);
  const atraso = (i: number) =>
    aquecido ? Math.min(i * 0.04, 0.24) : 0.24 + Math.min(i * 0.05, 0.4);

  const irParaPagina = (proxima: number) => {
    setPagina(proxima);
    topoGradeRef.current?.scrollIntoView({
      block: 'start',
      behavior: reduzir ? 'auto' : 'smooth',
    });
  };

  return (
    <div className={styles.raiz}>
      <div className={styles.regua}>
        <AbasFiltro
          abas={abas}
          ativa={categoria}
          aoMudar={setCategoria}
          layoutId="solucoes-aba-ativa"
          ariaLabel="Filtrar por categoria"
        />
        <div className={styles.reguaDireita}>
          <BuscaCatalogo
            valor={busca}
            aoMudar={setBusca}
            placeholder="Busque por nome, ferramenta ou área"
          />
          <PainelMaisFiltros
            titulo="Ferramentas"
            opcoes={facetasFerramentas}
            selecionadas={ferramentasSel}
            aoAlternar={(id) =>
              setFerramentasSel((atual) =>
                atual.includes(id) ? atual.filter((f) => f !== id) : [...atual, id],
              )
            }
            aoLimpar={() => setFerramentasSel([])}
          />
        </div>
      </div>

      <ChipsAtivos
        chips={ferramentasSel.map((f) => ({
          id: `ferramenta:${f}`,
          rotulo: f,
          aoRemover: () => setFerramentasSel((atual) => atual.filter((x) => x !== f)),
        }))}
        aoLimparTudo={() => setFerramentasSel([])}
      />

      <div className={styles.linhaMeta} ref={topoGradeRef}>
        <p className={styles.contagem} aria-live="polite">
          {filtradas.length} {filtradas.length === 1 ? 'solução' : 'soluções'}
          {haFiltro && filtradas.length !== solucoes.length && ` de ${solucoes.length}`}
        </p>
        <div className={styles.ordenacao} role="group" aria-label="Ordenar">
          <button
            type="button"
            className={styles.ordenar}
            data-ativo={ordem === 'recentes' ? '' : undefined}
            onClick={() => setOrdem('recentes')}
          >
            Recentes
          </button>
          <button
            type="button"
            className={styles.ordenar}
            data-ativo={ordem === 'alfabetica' ? '' : undefined}
            onClick={() => setOrdem('alfabetica')}
          >
            A–Z
          </button>
        </div>
      </div>

      {visiveis.length === 0 ? (
        <EmptyState
          title={haFiltro ? 'Nada com esses filtros' : 'O catálogo está vazio'}
          description={
            haFiltro
              ? 'Nenhuma solução combina busca, categoria e ferramentas ao mesmo tempo. Afrouxe um dos três.'
              : 'As primeiras soluções aparecem aqui assim que forem publicadas.'
          }
          action={
            haFiltro ? (
              <Button variant="secondary" onClick={limparTudo}>
                Limpar filtros
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className={styles.grade}>
          <AnimatePresence mode="popLayout">
            {visiveis.map((solucao, i) => (
              <motion.div
                key={solucao.id}
                /* `position`, nunca `true`: com `true` o card estica durante o FLIP. */
                layout={reduzir ? false : 'position'}
                initial={reduzir ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.16, ease: 'easeOut' } }}
                transition={{
                  layout: { duration: 0.3, ease: [0.32, 0.08, 0.24, 1] },
                  opacity: { duration: 0.4, ease: [0.32, 0.08, 0.24, 1], delay: atraso(i) },
                  y: { duration: 0.44, ease: [0.32, 0.08, 0.24, 1], delay: atraso(i) },
                }}
              >
                <CartaoSolucao
                  solucao={solucao}
                  icone={(solucao.categoria && icones[solucao.categoria]) || iconePadrao}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {totalPaginas > 1 && (
        <div className={styles.rodapePaginas}>
          <p className={styles.mostrando}>
            Mostrando {(paginaVisivel - 1) * POR_PAGINA + 1}–
            {Math.min(paginaVisivel * POR_PAGINA, filtradas.length)} de {filtradas.length}
          </p>
          <Pagination page={paginaVisivel} totalPages={totalPaginas} onPageChange={irParaPagina} />
        </div>
      )}
    </div>
  );
}
