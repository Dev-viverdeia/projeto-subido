'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Button, EmptyState } from '@/design-system/via';
import type { FormacaoResumo } from '@/lib/conteudo/queries';
import { BuscaCatalogo } from '../../_components/filtros/BuscaCatalogo';
import { useDebounce } from '../../_components/filtros/useDebounce';
import { atualizarUrlFiltros, type FiltrosIniciais } from '../../_components/filtros/urlFiltros';
import { CartaoFormacao } from './CartaoFormacao';
import styles from './CatalogoFormacoes.module.css';

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * A régua daqui é CURTA de propósito: busca e ordenação. O schema de formações
 * não tem categoria — filtro sem dado atrás seria enfeite (regra da casa:
 * nunca inventar). Quando a coluna existir, as abas entram como nas soluções.
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

  const haFiltro = buscaLenta !== '';

  const [aquecido, setAquecido] = useState(false);
  useEffect(() => {
    const quadro = requestAnimationFrame(() => setAquecido(true));
    return () => cancelAnimationFrame(quadro);
  }, []);
  const atraso = (i: number) =>
    aquecido ? Math.min(i * 0.04, 0.24) : 0.24 + Math.min(i * 0.05, 0.4);

  return (
    <div className={styles.raiz}>
      <div className={styles.regua}>
        <p className={styles.contagem} aria-live="polite">
          {filtradas.length} {filtradas.length === 1 ? 'formação' : 'formações'}
          {haFiltro && filtradas.length !== formacoes.length && ` de ${formacoes.length}`}
        </p>
        <div className={styles.reguaDireita}>
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
        </div>
      </div>

      {filtradas.length === 0 ? (
        <EmptyState
          title={haFiltro ? 'Nada com essa busca' : 'Nenhuma formação publicada'}
          description={
            haFiltro
              ? 'Nenhuma formação combina com o termo. Tente outra palavra.'
              : 'As trilhas aparecem aqui assim que forem publicadas.'
          }
          action={
            haFiltro ? (
              <Button variant="secondary" onClick={() => setBusca('')}>
                Limpar busca
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className={styles.grade}>
          <AnimatePresence mode="popLayout">
            {filtradas.map((formacao, i) => (
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
