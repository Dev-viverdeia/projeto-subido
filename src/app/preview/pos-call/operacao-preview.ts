import type { OperacaoResumoCall } from '@/lib/calls/estado-resumo';

/** Simula uma leitura da fila na prévia local; a rota não existe em produção. */
export function operacaoPreview(estado: string): OperacaoResumoCall[] | null {
  if (estado === 'indisponivel') return null;
  if (estado === 'sem-resumo') return [];
  const agora = Date.now();
  const espera = estado === 'fila' || estado === 'retentativa';
  return [
    {
      tipo: 'pos_call',
      status: espera ? 'pendente' : 'processando',
      tentativas: estado === 'retentativa' ? 2 : 0,
      disponivelEm: new Date(agora).toISOString(),
      atualizadaEm: new Date(agora - (estado === 'demorada' ? 600_000 : 0)).toISOString(),
      bloqueadoAte: estado === 'processando' ? new Date(agora + 180_000).toISOString() : null,
    },
  ];
}
