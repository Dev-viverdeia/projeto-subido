import type { ResumoProjetoExecucao } from './queries';
import {
  classificarPrioridadeEntrega,
  ordenarEntregasPorPrioridade,
  type TipoPrioridadeEntrega,
} from './prioridade';

export type PendenciaEntrega = {
  id: string;
  projetoId: string;
  href: string;
  empresa: string;
  projeto: string;
  motivo: string;
  detalhe: string;
  tipo: TipoPrioridadeEntrega;
};

/**
 * Transforma o estado vivo das entregas em avisos acionáveis.
 *
 * Não existe estado de "lido": a pendência some quando o fato que a originou é
 * resolvido. Assim, o cabeçalho não vira uma caixa de entrada paralela ao trabalho.
 */
export function montarPendenciasEntrega(
  projetos: ResumoProjetoExecucao[],
  agora = new Date(),
): PendenciaEntrega[] {
  return ordenarEntregasPorPrioridade(projetos, agora).flatMap((projeto) => {
    const prioridade = classificarPrioridadeEntrega(projeto, agora);
    const deveAparecer = prioridade.grupo === 'acao' || prioridade.grupo === 'cliente';
    if (!deveAparecer) return [];

    return [
      {
        id: `${projeto.id}:${prioridade.tipo}`,
        projetoId: projeto.id,
        href: `/entregas/${projeto.id}`,
        empresa: projeto.empresa,
        projeto: projeto.titulo,
        motivo: prioridade.rotulo,
        detalhe: prioridade.detalhe,
        tipo: prioridade.tipo,
      },
    ];
  });
}
