import type { EncerramentoProjeto } from '@/lib/projetos-execucao/encerramento';
import type { EvolucaoProjeto } from '@/lib/projetos-execucao/evolucao';
import type { MudancaEscopoProjeto } from '@/lib/projetos-execucao/mudancas-escopo';
import type { TipoEventoProjeto } from '@/lib/projetos-execucao/eventos';
import type {
  StatusClienteProjeto,
  StatusProjetoExecucao,
  StatusTarefaProjeto,
} from '@/lib/projetos-execucao/status';

export type TarefaPortalCliente = {
  id: string;
  faseId: string;
  faseTitulo: string;
  titulo: string;
  concluidoQuando: string;
  entregavel: string;
  ordem: number;
  status: StatusTarefaProjeto;
  clienteStatus: StatusClienteProjeto;
  clienteNota: string | null;
  entregavelUrl: string | null;
  solicitadoEm: string | null;
  respondidoEm: string | null;
  comentario: string | null;
};

export type ArquivoPortalCliente = {
  id: string;
  tarefaId: string | null;
  titulo: string;
  descricao: string | null;
  nomeOriginal: string;
  mimeType: string;
  tamanhoBytes: number;
  versao: number;
  publicadoEm: string;
};

export type EventoPortalCliente = {
  id: string;
  tarefaId: string | null;
  mudancaEscopoId?: string | null;
  tipo: Extract<
    TipoEventoProjeto,
    | 'aprovacao_solicitada'
    | 'entrega_aprovada'
    | 'ajustes_solicitados'
    | 'arquivo_liberado'
    | 'pendencia_concluida'
    | 'mudanca_escopo_solicitada'
    | 'mudanca_escopo_incluida'
    | 'mudanca_escopo_proposta'
    | 'mudanca_escopo_aprovada'
    | 'mudanca_escopo_recusada'
    | 'encerramento_enviado'
    | 'projeto_encerrado'
    | 'revisao_resultado_registrada'
  >;
  autor: 'prestador' | 'cliente';
  comentario: string | null;
  criadoEm: string;
};

export type AcaoPortalCliente = {
  id: string;
  titulo: string;
  categoria: 'acesso' | 'dependencia';
  prazoEm: string | null;
  status: 'pendente' | 'concluida';
  responsavelNome: string | null;
};

export type ProjetoPortalCliente = {
  id: string;
  titulo: string;
  empresa: string;
  resumo: string;
  objetivo: string;
  status: StatusProjetoExecucao;
  inicioEm: string;
  prazoEm: string | null;
  feitas: number;
  total: number;
  tarefas: TarefaPortalCliente[];
  arquivos: ArquivoPortalCliente[];
  eventos: EventoPortalCliente[];
  dependencias: AcaoPortalCliente[];
  mudancasEscopo: MudancaEscopoProjeto[];
  briefing: {
    objetivo: string;
    criterioSucesso: string;
    responsavelCliente: string;
    responsavelTecnico: string;
    proximosPassos: string[];
  } | null;
  encerramento: EncerramentoProjeto | null;
  evolucao: EvolucaoProjeto | null;
};
