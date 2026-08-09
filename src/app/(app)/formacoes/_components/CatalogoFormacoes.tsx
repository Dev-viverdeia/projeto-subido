'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Button, EmptyState, Pagination } from '@/design-system/via';
import type { FormacaoResumo } from '@/lib/conteudo/queries';
import { contarConcluidas, estadoDoProgresso, useProgresso } from '@/lib/progresso/local';
import { ControleSegmentado } from '../../_components/filtros/ControleSegmentado';
import { BuscaCatalogo } from '../../_components/filtros/BuscaCatalogo';
import { useDebounce } from '../../_components/filtros/useDebounce';
import { atualizarUrlFiltros } from '../../_components/filtros/espelhoUrl';
import type { FiltrosIniciais } from '../../_components/filtros/urlFiltros';
import { CartaoFormacao } from './CartaoFormacao';
import styles from './CatalogoFormacoes.module.css';

/* Doze, e o número não é copiado de soluções — é o que a GRADE pede. Esta grade
   vai a 4 · 3 · 2 colunas conforme a largura, e 12 é o único valor pequeno que
   divide os três: nenhuma página termina com fileira quebrada. Dez, que parecia
   mais adequado ao pôster alto, deixaria dois cards órfãos a 1440. */
const POR_PAGINA = 12;
const TODAS = 'todas';

/** Sem acento e minúsculo — "automação" encontra "automacao" e vice-versa. */
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

type Situacao = typeof TODAS | 'andamento' | 'concluidas';

/**
 * A ilha de descoberta das formações — a MESMA régua do catálogo de soluções.
 *
 * O QUE MUDOU, e por que não era só gosto. Este catálogo tinha abas tipográficas
 * para a situação, dois botões avulsos para a ordem e a contagem solta no meio da
 * régua; o de soluções tinha controle segmentado nos dois, contagem no rodapé e
 * paginação. Dois catálogos do mesmo produto, a um clique de distância, com três
 * gramáticas diferentes de controle — é exatamente a história que abre o
 * CLAUDE.md, e ela começa assim: duas telas que "quase" combinam.
 *
 * SITUAÇÃO É O ÚNICO EIXO COM DADO. Formação não tem categoria no schema, e
 * filtro sem dado atrás é enfeite; quando a coluna existir, ela entra aqui do
 * mesmo jeito que a de soluções.
 *
 * E ELA NÃO VAI PARA A URL, de propósito: o progresso é local ao dispositivo,
 * então um link compartilhado com `?v=andamento` não reproduziria nada no
 * aparelho do outro. Filtro que não sobrevive ao compartilhamento não pertence à
 * URL — busca e ordem, que são do conteúdo, continuam indo.
 */
export function CatalogoFormacoes({
  formacoes,
  filtrosIniciais,
}: {
  formacoes: FormacaoResumo[];
  filtrosIniciais: FiltrosIniciais;
}) {
  const [busca, setBusca] = useState(filtrosIniciais.q);
  const [ordem, setOrdem] = useState<'recentes' | 'alfabetica'>(filtrosIniciais.ordem);
  const [situacao, setSituacao] = useState<Situacao>(TODAS);

  const progresso = useProgresso();
  const buscaLenta = useDebounce(busca, 400);
  const reduzir = useReducedMotion();
  const topoGradeRef = useRef<HTMLDivElement>(null);

  /* Página DERIVADA, não efeito: ela guarda a assinatura dos filtros sob a qual
     foi escolhida. Filtro mudou → assinatura não bate → volta à 1ª no MESMO
     render. Um efeito com `setPagina(1)` renderizaria a página errada por um
     frame — e o lint de hooks reprova o setState síncrono em efeito, com razão. */
  const assinaturaFiltros = `${buscaLenta}|${situacao}|${ordem}`;
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
      ordem: ordem === 'recentes' ? null : ordem,
    });
  }, [busca, buscaLenta, ordem]);

  /* Situação por formação, derivada numa passada só — e reusando o MESMO helper
     do catálogo de soluções. Antes esta regra estava reescrita aqui, com um
     estado a menos: formação sem aula nenhuma caía em "não iniciada", quando na
     verdade ela não tem o que iniciar. */
  const situacaoDe = useMemo(() => {
    const mapa = new Map<string, ReturnType<typeof estadoDoProgresso>>();
    for (const f of formacoes) {
      mapa.set(f.id, estadoDoProgresso(contarConcluidas(progresso, f.aulaIds), f.aulas));
    }
    return mapa;
  }, [formacoes, progresso]);

  /* A contagem por opção responde "vale a pena clicar?" ANTES do clique — e é
     contada sobre o catálogo INTEIRO, não sobre o resultado da busca: um número
     que mudasse a cada tecla deixaria de ser referência. */
  const opcoesSituacao = useMemo(() => {
    let andamento = 0;
    let concluidas = 0;
    for (const estado of situacaoDe.values()) {
      if (estado === 'em-andamento') andamento += 1;
      if (estado === 'concluida') concluidas += 1;
    }
    return [
      { id: TODAS, rotulo: 'Todas', total: formacoes.length },
      { id: 'andamento', rotulo: 'Em andamento', total: andamento },
      { id: 'concluidas', rotulo: 'Concluídas', total: concluidas },
    ];
  }, [formacoes.length, situacaoDe]);

  /* Corpus de busca pré-normalizado — uma vez por lista, não por tecla. */
  const corpus = useMemo(
    () => new Map(formacoes.map((f) => [f.id, normalizar(`${f.titulo} ${f.resumo ?? ''}`)])),
    [formacoes],
  );

  const filtradas = useMemo(() => {
    let lista = formacoes;

    if (situacao !== TODAS) {
      const alvo = situacao === 'andamento' ? 'em-andamento' : 'concluida';
      lista = lista.filter((f) => situacaoDe.get(f.id) === alvo);
    }

    const termos = normalizar(buscaLenta).split(/\s+/).filter(Boolean);
    if (termos.length > 0) {
      lista = lista.filter((f) => {
        const doc = corpus.get(f.id) ?? '';
        return termos.every((t) => doc.includes(t));
      });
    }

    if (ordem === 'alfabetica') {
      lista = [...lista].sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'));
    }

    return lista;
  }, [formacoes, situacao, situacaoDe, buscaLenta, corpus, ordem]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaVisivel = Math.min(pagina, totalPaginas);
  const visiveis = filtradas.slice((paginaVisivel - 1) * POR_PAGINA, paginaVisivel * POR_PAGINA);

  const haFiltro = buscaLenta !== '' || situacao !== TODAS;
  const limparTudo = () => {
    setBusca('');
    setSituacao(TODAS);
  };

  /* Stagger em duas velocidades: a primeira carga espera a cascata da página;
     resposta a filtro é imediata. Estado virado DENTRO de um rAF — ler ref
     durante o render é proibido pelo lint de hooks. */
  const [aquecido, setAquecido] = useState(false);
  useEffect(() => {
    const quadro = requestAnimationFrame(() => setAquecido(true));
    return () => cancelAnimationFrame(quadro);
  }, []);
  /* A primeira pintura nasce pronta. A cascata antiga segurava o último card por
     quase 800ms e fazia uma página já carregada parecer lenta. Depois da
     primeira pintura, filtros mantêm só um stagger curto para comunicar a troca. */
  const atraso = (i: number) => (aquecido ? Math.min(i * 0.025, 0.1) : 0);

  const irParaPagina = (proxima: number) => {
    setPagina(proxima);
    topoGradeRef.current?.scrollIntoView({
      block: 'start',
      behavior: reduzir ? 'auto' : 'smooth',
    });
  };

  return (
    <div className={styles.raiz}>
      {/* SITUAÇÃO E ORDEM na mesma linha, as duas como controle segmentado —
          mesma natureza de escolha ("um de N"), mesma forma. O que as distingue é
          a posição e o rótulo "Ordenar". */}
      <div className={styles.regua}>
        <ControleSegmentado
          opcoes={opcoesSituacao}
          ativa={situacao}
          aoMudar={(id) => setSituacao(id as Situacao)}
          layoutId="formacoes-situacao"
          ariaLabel="Filtrar por situação"
        />

        <div className={styles.reguaDireita}>
          <span className={styles.ordenarRotulo}>Ordenar</span>
          <ControleSegmentado
            opcoes={[
              { id: 'recentes', rotulo: 'Recentes' },
              { id: 'alfabetica', rotulo: 'A–Z' },
            ]}
            ativa={ordem}
            aoMudar={(id) => setOrdem(id as typeof ordem)}
            layoutId="formacoes-ordem"
            ariaLabel="Ordenar"
          />
        </div>
      </div>

      {/* A busca em LINHA PRÓPRIA, como no catálogo de soluções: dividindo a
          régua com dois trilhos segmentados, quem cedia largura era sempre ela —
          o trilho tem largura de conteúdo e não encolhe. O campo caía para 240px
          e cortava o placeholder. */}
      <div className={styles.linhaBusca}>
        <BuscaCatalogo valor={busca} aoMudar={setBusca} placeholder="Buscar formação" />
      </div>

      {/* Âncora do scroll da paginação — a contagem que ficava aqui desceu para o
          rodapé, junto da paginação que ela descreve. */}
      <div className={styles.ancoraGrade} ref={topoGradeRef} aria-hidden="true" />

      {visiveis.length === 0 ? (
        /* A BUSCA VEM PRIMEIRO, e a ordem anterior produzia uma mentira: com
           "Em andamento" ativo mostrando 3 no próprio controle e uma busca sem
           resultado, a tela dizia "Nenhuma formação em andamento" — negando o
           número que estava escrito dois palmos acima. Quem esvaziou a lista foi
           o termo, e é isso que o estado vazio precisa dizer. */
        <EmptyState
          title={
            buscaLenta
              ? 'Nada com essa busca'
              : situacao === 'andamento'
                ? 'Nenhuma formação em andamento'
                : situacao === 'concluidas'
                  ? 'Nenhuma formação concluída'
                  : 'Nenhuma formação publicada'
          }
          description={
            buscaLenta
              ? situacao === TODAS
                ? 'Nenhuma formação combina com o termo. Tente outra palavra.'
                : 'Nenhuma formação combina o termo com esse recorte. Afrouxe um dos dois.'
              : situacao === 'andamento'
                ? 'Assim que você concluir a primeira aula de uma trilha, ela aparece aqui.'
                : situacao === 'concluidas'
                  ? 'As trilhas que você terminar ficam guardadas aqui.'
                  : 'As trilhas aparecem aqui assim que forem publicadas.'
          }
          action={
            haFiltro ? (
              <Button variant="secondary" onClick={limparTudo}>
                Ver todas
              </Button>
            ) : undefined
          }
        />
      ) : (
        /* A CHAVE POR PÁGINA separa os dois tipos de mudança. Filtrar tira alguns
           cards do conjunto: ali a saída animada comunica algo. Paginar troca os
           doze de uma vez — todo card sai e todo card entra, e o resultado é um
           crossfade de duas grades inteiras, com o dobro de nós em tela durante a
           transição. Com a chave, a troca de página REMONTA a grade. */
        <div className={styles.grade} key={`pagina-${paginaVisivel}`}>
          <AnimatePresence mode="popLayout">
            {visiveis.map((formacao, i) => (
              <motion.div
                key={formacao.id}
                /* `position`, nunca `true`: com `true` o pôster estica no FLIP. */
                layout={reduzir ? false : 'position'}
                initial={reduzir || !aquecido ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.12, ease: 'easeOut' } }}
                transition={{
                  layout: { duration: 0.2, ease: [0.32, 0.08, 0.24, 1] },
                  opacity: { duration: 0.18, ease: [0.32, 0.08, 0.24, 1], delay: atraso(i) },
                  y: { duration: 0.2, ease: [0.32, 0.08, 0.24, 1], delay: atraso(i) },
                }}
              >
                <CartaoFormacao formacao={formacao} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* O RODAPÉ É O CENTRO DE GRAVIDADE DA NAVEGAÇÃO: contagem, atalho para o
          catálogo inteiro e páginas, os três no mesmo eixo da grade. A contagem
          aparece sempre que há resultado — ela responde "estou vendo tudo?" em
          qualquer tamanho de catálogo. Só as páginas são condicionais: com uma
          página só, setas desabilitadas seriam cromo morto. */}
      {filtradas.length > 0 && (
        <div className={styles.rodapePaginas}>
          <p className={styles.mostrando} aria-live="polite">
            Mostrando {(paginaVisivel - 1) * POR_PAGINA + 1}–
            {Math.min(paginaVisivel * POR_PAGINA, filtradas.length)} de {filtradas.length}
            {haFiltro && filtradas.length !== formacoes.length && (
              <>
                <span className={styles.separador} aria-hidden="true">
                  ·
                </span>
                <button type="button" className={styles.verTodas} onClick={limparTudo}>
                  ver todas as {formacoes.length}
                </button>
              </>
            )}
          </p>

          {totalPaginas > 1 && (
            <Pagination
              page={paginaVisivel}
              totalPages={totalPaginas}
              onPageChange={irParaPagina}
            />
          )}
        </div>
      )}
    </div>
  );
}
