import type { StatusProjetoExecucao } from './status';

export type TipoServico = 'pontual' | 'recorrente';
export type GestaoEntrega = {
  tipoServico?: TipoServico;
  encerramentoManualEm?: string | null;
  recorrenciaEncerradaEm?: string | null;
  concluidoEm?: string | null;
};

export function estaEmAcompanhamento(projeto: GestaoEntrega & { status: StatusProjetoExecucao }) {
  return (
    projeto.status === 'concluido' &&
    projeto.tipoServico === 'recorrente' &&
    !projeto.recorrenciaEncerradaEm
  );
}

export function rotuloGestao(projeto: GestaoEntrega & { status: StatusProjetoExecucao }) {
  if (estaEmAcompanhamento(projeto)) return 'Em acompanhamento';
  if (projeto.status === 'concluido') return 'Concluído';
  return projeto.tipoServico === 'recorrente' ? 'Projeto recorrente' : 'Projeto pontual';
}
