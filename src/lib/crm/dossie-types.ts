import type { StatusCall, TipoCall } from '@/lib/calls/tipos';
import type { Enums, Tables } from '@/lib/supabase/types.generated';
import type {
  DossieEnriquecido,
  FonteEnriquecimento,
  StatusEnriquecimento,
} from './enriquecimento';
import type { OportunidadeCrm } from './queries';

export type EventoDossie = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  ocorridoEm: string;
  fonte: string;
};

export type ExecucaoEnriquecimento = {
  id: string;
  status: StatusEnriquecimento;
  dominio: string | null;
  linkedinUrl: string | null;
  erro: string | null;
  solicitadoEm: string;
  concluidoEm: string | null;
  dossie: DossieEnriquecido | null;
  fontes: FonteEnriquecimento[];
};

export type CallDossieLead = {
  id: string;
  titulo: string;
  tipo: TipoCall;
  status: StatusCall;
  agendadaPara: string;
  iniciadaEm: string | null;
  encerradaEm: string | null;
  duracaoMinutos: number;
  codigoPublico: string;
};

export type AcaoPlanoDossie = {
  id: string;
  titulo: string;
  prazoEm: string | null;
  reuniaoId: string | null;
};

export type ProjetoDossie = {
  id: string;
  titulo: string;
  status: Tables<'projetos_execucao'>['status'];
  atualizadoEm: string;
};

export type ProjetoAtivoDossie = ProjetoDossie;

export type PropostaDossie = {
  id: string;
  titulo: string;
  status: Enums<'proposta_status'>;
};

export type DossieLead = {
  oportunidade: OportunidadeCrm;
  empresa: {
    nome: string;
    dominio: string | null;
    setor: string | null;
    porte: string | null;
    cidade: string | null;
    estado: string | null;
  };
  contato: {
    nome: string;
    email: string | null;
    telefone: string | null;
    cargo: string | null;
    linkedinUrl: string | null;
  } | null;
  eventos: EventoDossie[];
  calls: CallDossieLead[];
  acoesPlano: AcaoPlanoDossie[];
  projetoAtivo: ProjetoAtivoDossie | null;
  /** Última entrega, inclusive quando já concluída. O CRM não perde o vínculo
      com o trabalho realizado quando o projeto deixa de estar ativo. */
  projetoRecente: ProjetoDossie | null;
  propostaRecente: PropostaDossie | null;
  enriquecimentos: ExecucaoEnriquecimento[];
  totalCalls: number;
};
