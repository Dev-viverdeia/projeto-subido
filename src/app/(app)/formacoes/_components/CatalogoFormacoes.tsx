'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Button, EmptyState } from '@/design-system/via';
import type { FormacaoResumo } from '@/lib/conteudo/queries';
import { useProgresso, contarConcluidas } from '@/lib/progresso/local';
import { AbasFiltro } from '../../_components/filtros/AbasFiltro';
import { BuscaCatalogo } from '../../_components/filtros/BuscaCatalogo';
import { useDebounce } from '../../_components/filtros/useDebounce';
import { atualizarUrlFiltros } from '../../_components/filtros/espelhoUrl';
import type { FiltrosIniciais } from '../../_components/filtros/urlFiltros';
import { CartaoFormacao } from './CartaoFormacao';
import styles from './CatalogoFormacoes.module.css';

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * Régua de descoberta das formações, toda ALINHADA À ESQUERDA acima da grade:
 * situação · busca · ordenação, com a contagem empurrada para a ponta direita
 * (ela é resultado, não controle).
 *
 * O filtro de SITUAÇÃO usa o único eixo de que temos dado real — o progresso.
 * Categoria não entra porque o schema de formações não tem a coluna, e filtro
 * sem dado atrás é enfeite (regra da casa: nunca inventar). Quando a coluna
 * existir, ela entra como nas soluções.
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
  /* Progresso NÃO entra na URL de propósito: ele é local ao dispositivo, então um
     link compartilhado com `?v=andamento` não reproduziria nada no aparelho do
     outro. Filtro que não sobrevive ao compartilhamento não pertence à URL. */
  const [situacao, setSituacao] = useState<'todas' | 'andamento' | 'concluidas'>('todas');
  const progresso = useProgresso();
  const buscaLenta = useDebounce(busca, 400);
  const reduzir = useReducedMotion();

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

  const filtradas = useMemo(() => {
    let lista = formacoes;
    const termos = normalizar(buscaLenta).split(/\s+/).filter(Boolean);
    if (termos.length > 0) {
      lista = lista.filter((f) => {
        const doc = normalizar(`${f.titulo} ${f.resumo ?? ''}`);
        return termos.every((t) => doc.includes(t));
      });
    }
    if (ordem === 'alfabetica') {
      lista = [...lista].sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'));
    }
    return lista;
  }, [formacoes, buscaLenta, ordem]);

  /* Situação por formação, derivada do progresso local numa passada só. */
  const situacaoDe = useMemo(() => {
    const mapa = new Map<string, 'nao-iniciada' | 'andamento' | 'concluida'>();
    for (const f of formacoes) {
      const feitas = contarConcluidas(progresso, f.aulaIds);
      mapa.set(
        f.id,
        feitas === 0 ? 'nao-iniciada' : feitas === f.aulas ? 'concluida' : 'andamento',
      );
    }
    return mapa;
  }, [formacoes, progresso]);

  const visiveis = useMemo(() => {
    if (situacao === 'todas') return filtradas;
    const alvo = situacao === 'andamento' ? 'andamento' : 'concluida';
    return filtradas.filter((f) => situacaoDe.get(f.id) === alvo);
  }, [filtradas, situacao, situacaoDe]);

  const haFiltro = buscaLenta !== '' || situacao !== 'todas';

  const [aquecido, setAquecido] = useState(false);
  useEffect(() => {
    const quadro = requestAnimationFrame(() => setAquecido(true));
    return () => cancelAnimationFrame(quadro);
  }, []);
  const atraso = (i: number) =>
    aquecido ? Math.min(i * 0.04, 0.24) : 0.24 + Math.min(i * 0.05, 0.4);

  return (
    <div className={styles.raiz}>
      {/* FILTROS À ESQUERDA, acima da grade. A contagem vai para a ponta direita:
          ela é resultado, não controle — e misturada aos filtros competia com
          eles pela primeira leitura. */}
      <div className={styles.regua}>
        <AbasFiltro
          abas={[
            { id: 'todas', rotulo: 'Todas' },
            { id: 'andamento', rotulo: 'Em andamento' },
            { id: 'concluidas', rotulo: 'Concluídas' },
          ]}
          ativa={situacao}
          aoMudar={(id) => setSituacao(id as typeof situacao)}
          layoutId="formacoes-situacao"
          ariaLabel="Filtrar por situação"
        />

        <BuscaCatalogo valor={busca} aoMudar={setBusca} placeholder="Buscar formação" />

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

        <p className={styles.contagem} aria-live="polite">
          {visiveis.length} {visiveis.length === 1 ? 'formação' : 'formações'}
          {haFiltro && visiveis.length !== formacoes.length && ` de ${formacoes.length}`}
        </p>
      </div>

      {visiveis.length === 0 ? (
        <EmptyState
          title={
            situacao === 'andamento'
              ? 'Nenhuma formação em andamento'
              : situacao === 'concluidas'
                ? 'Nenhuma formação concluída'
                : buscaLenta
                  ? 'Nada com essa busca'
                  : 'Nenhuma formação publicada'
          }
          description={
            situacao === 'andamento'
              ? 'Assim que você abrir a primeira aula de uma trilha, ela aparece aqui.'
              : situacao === 'concluidas'
                ? 'As trilhas que você terminar ficam guardadas aqui.'
                : buscaLenta
                  ? 'Nenhuma formação combina com o termo. Tente outra palavra.'
                  : 'As trilhas aparecem aqui assim que forem publicadas.'
          }
          action={
            haFiltro ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setBusca('');
                  setSituacao('todas');
                }}
              >
                Ver todas
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className={styles.grade}>
          <AnimatePresence mode="popLayout">
            {visiveis.map((formacao, i) => (
              <motion.div
                key={formacao.id}
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
                <CartaoFormacao formacao={formacao} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
