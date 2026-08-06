'use client';

import { useMemo } from 'react';
import { useProgresso } from '@/lib/progresso/local';
import type { AulaResumo, FormacaoCompleta, ModuloComAulas } from '@/lib/conteudo/queries';
import { somarDuracoes } from '../../_components/tempo';

export type StatusAula = 'concluida' | 'atual' | 'futura';

export type ModuloDoCurriculo = {
  modulo: ModuloComAulas;
  aulas: Array<{ aula: AulaResumo; status: StatusAula }>;
  feitas: number;
  completo: boolean;
};

export type Curriculo = {
  modulos: ModuloDoCurriculo[];
  /** Todas as aulas na ordem global — é o que o trilho de progresso consome. */
  planas: AulaResumo[];
  /**
   * Os ids das aulas concluídas, não só a contagem.
   *
   * A barra segmentada do `TrilhoProgresso` precisa saber QUAIS: com um número,
   * a única coisa possível é pintar as N primeiras casas, e aula concluída fora
   * de ordem faria a barra contradizer a lista logo ao lado.
   */
  feitasIds: ReadonlySet<string>;
  feitas: number;
  total: number;
  pct: number;
  /** A primeira aula NÃO concluída na ordem global — o alvo do "Continuar". */
  proxima: AulaResumo | null;
  moduloDaProximaId: string | null;
  duracaoTotalSeg: number;
  comecou: boolean;
  concluiu: boolean;
};

/**
 * Deriva o estado do currículo inteiro de UMA leitura do progresso — hero,
 * lista de módulos e resumo lateral consomem o mesmo objeto, então nunca
 * divergem entre si. Derivação pura via useMemo; zero query.
 *
 * Regra de status (a da referência): `concluida` = está no progresso; `atual` =
 * a PRIMEIRA não concluída na ordem global do curso; o resto é `futura`.
 */
export function useCurriculo(formacao: FormacaoCompleta): Curriculo {
  const progresso = useProgresso();

  return useMemo(() => {
    const planas = formacao.modulos.flatMap((m) => m.aulas.map((aula) => ({ aula, modulo: m })));
    const indiceAtual = planas.findIndex(({ aula }) => !progresso.aulas[aula.id]);
    /* Índice global por aula SEM contador mutável — o lint de hooks não consegue
       provar que um `cursor += 1` é local ao render, e tem razão em desconfiar. */
    const indiceGlobal = new Map(planas.map((p, i) => [p.aula.id, i]));

    const statusDe = (aulaId: string): StatusAula => {
      if (progresso.aulas[aulaId]) return 'concluida';
      return indiceGlobal.get(aulaId) === indiceAtual ? 'atual' : 'futura';
    };

    const modulos: ModuloDoCurriculo[] = formacao.modulos.map((m) => {
      const aulas = m.aulas.map((aula) => ({ aula, status: statusDe(aula.id) }));
      const feitas = aulas.filter((a) => a.status === 'concluida').length;
      return {
        modulo: m,
        aulas,
        feitas,
        completo: m.aulas.length > 0 && feitas === m.aulas.length,
      };
    });

    const total = planas.length;
    const feitasIds = new Set(
      planas.filter(({ aula }) => progresso.aulas[aula.id]).map(({ aula }) => aula.id),
    );
    const feitas = feitasIds.size;
    const atual = indiceAtual === -1 ? null : (planas[indiceAtual] ?? null);

    return {
      modulos,
      planas: planas.map(({ aula }) => aula),
      feitasIds,
      feitas,
      total,
      pct: total === 0 ? 0 : Math.round((feitas / total) * 100),
      proxima: atual?.aula ?? null,
      moduloDaProximaId: atual?.modulo.id ?? null,
      duracaoTotalSeg: somarDuracoes(planas.map(({ aula }) => aula.duracao_seg)),
      comecou: feitas > 0,
      concluiu: total > 0 && feitas === total,
    };
  }, [formacao, progresso]);
}
