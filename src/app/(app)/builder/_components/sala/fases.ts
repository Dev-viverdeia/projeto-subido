import type { DocumentoSolucao } from '@/lib/builder/schema';
import type { EstadoTarefa } from '@/lib/builder/queries';

/**
 * As três fases do plano — e o que fazer quando o documento não as declara.
 *
 * O CAMPO É OPCIONAL NO SCHEMA por compatibilidade: todo documento gerado antes
 * da mudança não tem `fase`. Aqui isso vira uma decisão de interface em vez de um
 * `?? 1` escondido: sem NENHUMA etapa declarando fase, o quadro não agrupa e a
 * régua de fases nem aparece. Um agrupamento de uma fase só é cromo morto, e
 * empurrar todas as etapas para "Fundação" seria rotular errado.
 *
 * Etapa com fase inválida não existe — o schema já limita a 1–3. O que pode
 * acontecer é o modelo pular uma fase (só 1 e 3, por exemplo); a régua mostra as
 * que TÊM etapa, não as três sempre, senão apareceria uma fase vazia com `0/0`.
 */
export const FASES = [
  {
    numero: 1,
    rotulo: 'Fundação',
    resumo: 'O que precisa existir antes de qualquer coisa funcionar.',
  },
  { numero: 2, rotulo: 'Construção', resumo: 'O que faz a solução funcionar de verdade.' },
  { numero: 3, rotulo: 'Polimento e lançamento', resumo: 'O que a deixa confiável e no ar.' },
] as const;

export type ResumoFase = {
  numero: number;
  rotulo: string;
  resumo: string;
  /** Índices das etapas desta fase, na ordem do documento. */
  indices: number[];
  feitas: number;
};

/** `null` quando nenhuma etapa declara fase — o quadro não agrupa. */
export function agruparPorFase(
  etapas: DocumentoSolucao['etapas'],
  tarefas: Record<number, EstadoTarefa>,
): ResumoFase[] | null {
  if (!etapas.some((e) => e.fase !== undefined)) return null;

  const grupos = FASES.map((f) => {
    const indices = etapas
      .map((e, i) => ({ e, i }))
      .filter(({ e }) => e.fase === f.numero)
      .map(({ i }) => i);

    return {
      ...f,
      indices,
      feitas: indices.reduce((n, i) => (tarefas[i] === 'feito' ? n + 1 : n), 0),
    };
  }).filter((f) => f.indices.length > 0);

  return grupos.length > 0 ? grupos : null;
}
