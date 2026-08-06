import type { SolucaoBuilder } from '@/lib/builder/queries';

/**
 * As quatro etapas da Sala do Projeto, e o que DESTRAVA cada uma.
 *
 * O TRAVAMENTO É DERIVADO, nunca gravado. Uma coluna `etapa_atual` seria um
 * segundo lugar dizendo o que o dado já diz — e o dia em que ela discordasse do
 * documento, a pessoa ficaria presa numa etapa que já cumpriu (ou solta numa que
 * não). Aqui cada etapa pergunta ao projeto se pode abrir:
 *
 *   criação   sempre — é onde a geração acontece
 *   entender  quando existe documento
 *   kit       quando existe documento (ferramentas e prompts vivem nele)
 *   construir quando a stack foi escolhida — sem ela o prompt de partida não
 *             existe, e um kanban sem por onde começar é lista de tarefas solta
 *
 * O cadeado da referência aparece exatamente aqui, e com motivo escrito: cada
 * etapa travada diz POR QUE está travada, em vez de só mostrar o ícone.
 */
export type IdEtapa = 'criacao' | 'entender' | 'kit' | 'construir';

export type EtapaSala = {
  id: IdEtapa;
  rotulo: string;
  /** Curto: vive sob o número no stepper. */
  numero: string;
};

export const ETAPAS: EtapaSala[] = [
  { id: 'criacao', rotulo: 'Criação', numero: '01' },
  { id: 'entender', rotulo: 'Entenda o projeto', numero: '02' },
  { id: 'kit', rotulo: 'Seu kit', numero: '03' },
  { id: 'construir', rotulo: 'Construir', numero: '04' },
];

/** `null` = liberada. String = o motivo do cadeado, dito à pessoa. */
export function motivoDoCadeado(etapa: IdEtapa, solucao: SolucaoBuilder): string | null {
  const temDocumento = solucao.documento !== null;

  if (etapa === 'criacao') return null;
  if (!temDocumento) return 'O projeto ainda está sendo criado.';
  if (etapa === 'construir' && !solucao.stack) return 'Escolha onde construir, no “Seu kit”.';
  return null;
}

/**
 * A etapa em que a pessoa DEVE estar ao abrir a sala — a última liberada.
 *
 * Derivada pelo mesmo motivo do travamento: abrir sempre na primeira faria quem
 * já tem o documento pronto passar por duas telas antes de chegar ao kanban.
 */
export function etapaInicial(solucao: SolucaoBuilder): IdEtapa {
  const liberadas = ETAPAS.filter((e) => motivoDoCadeado(e.id, solucao) === null);
  return liberadas[liberadas.length - 1]?.id ?? 'criacao';
}

/** Contagem real do kanban: quantas etapas do documento estão em `feito`. */
export function contarTarefas(solucao: SolucaoBuilder): { feitas: number; total: number } {
  const total = solucao.documento?.etapas.length ?? 0;
  let feitas = 0;
  for (let i = 0; i < total; i += 1) {
    if (solucao.tarefas[i] === 'feito') feitas += 1;
  }
  return { feitas, total };
}
