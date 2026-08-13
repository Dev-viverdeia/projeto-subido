import { callPodeAbrir, ROTULO_STATUS_CALL } from '@/lib/calls/tipos';
import { ROTULO_STATUS_PROJETO } from '@/lib/projetos-execucao/status';
import { ROTULO_STATUS_PROPOSTA } from '@/lib/propostas/status';
import type { DossieLead } from './dossie-types';

export type EtapaCicloCliente = {
  id: 'contexto' | 'conversa' | 'proposta' | 'entrega';
  numero: string;
  rotulo: string;
  estado: string;
  href: string | null;
  comprovada: boolean;
  atual: boolean;
};

export type DecisaoCicloCliente = {
  rotulo: string;
  titulo: string;
  href: string | null;
  acao: string;
  novoCiclo: boolean;
  apoioHref: string | null;
  apoioRotulo: string | null;
};

function destinoDaCall(call: DossieLead['calls'][number]): string {
  return callPodeAbrir(call.status) ? `/sala/${call.codigoPublico}` : `/calls/${call.id}`;
}

/**
 * Traduz fatos já carregados pelo dossiê em uma única leitura do ciclo.
 * As etapas são independentes: se uma venda aconteceu fora de Calls, a tela
 * mostra "Não registrada" em vez de inventar uma conversa concluída.
 */
export function montarCicloCliente(lead: DossieLead): {
  etapas: EtapaCicloCliente[];
  decisao: DecisaoCicloCliente;
} {
  const proposta = lead.propostaRecente;
  const call =
    (proposta?.reuniaoId ? lead.calls.find((item) => item.id === proposta.reuniaoId) : undefined) ??
    lead.calls[0] ??
    null;
  const projeto = lead.projetoRecente;
  const contextoPronto = Boolean(
    lead.oportunidade.enriquecidoEm ||
    lead.enriquecimentos.some((execucao) => execucao.status === 'concluido'),
  );
  const etapaAtual = projeto ? 'entrega' : proposta ? 'proposta' : call ? 'conversa' : 'contexto';

  const etapas: EtapaCicloCliente[] = [
    {
      id: 'contexto',
      numero: '01',
      rotulo: 'Contexto',
      estado: contextoPronto ? 'Lead enriquecido' : 'Lead registrado',
      href: `/crm/${lead.oportunidade.id}`,
      comprovada: true,
      atual: etapaAtual === 'contexto',
    },
    {
      id: 'conversa',
      numero: '02',
      rotulo: 'Conversa',
      estado: call ? ROTULO_STATUS_CALL[call.status] : 'Não registrada',
      href: call ? destinoDaCall(call) : null,
      comprovada: Boolean(call),
      atual: etapaAtual === 'conversa',
    },
    {
      id: 'proposta',
      numero: '03',
      rotulo: 'Proposta',
      estado: proposta ? ROTULO_STATUS_PROPOSTA[proposta.status] : 'Ainda não criada',
      href: proposta ? `/propostas/${proposta.id}` : null,
      comprovada: Boolean(proposta),
      atual: etapaAtual === 'proposta',
    },
    {
      id: 'entrega',
      numero: '04',
      rotulo: 'Entrega',
      estado: projeto ? ROTULO_STATUS_PROJETO[projeto.status] : 'Ainda não iniciada',
      href: projeto ? `/solucoes/execucao/${projeto.id}` : null,
      comprovada: Boolean(projeto),
      atual: etapaAtual === 'entrega',
    },
  ];

  const compromisso = lead.acoesPlano[0] ?? null;
  if (compromisso) {
    return {
      etapas,
      decisao: {
        rotulo: 'Compromisso confirmado',
        titulo: compromisso.titulo,
        href: compromisso.reuniaoId
          ? `/calls/${compromisso.reuniaoId}`
          : `/crm/${lead.oportunidade.id}`,
        acao: compromisso.reuniaoId ? 'Abrir call' : 'Abrir no CRM',
        novoCiclo: false,
        apoioHref: projeto ? `/solucoes/execucao/${projeto.id}` : null,
        apoioRotulo: projeto ? 'Abrir entrega' : null,
      },
    };
  }

  if (lead.projetoAtivo) {
    return {
      etapas,
      decisao: {
        rotulo: 'Entrega em andamento',
        titulo: `Continuar ${lead.projetoAtivo.titulo}`,
        href: `/solucoes/execucao/${lead.projetoAtivo.id}`,
        acao: 'Continuar entrega',
        novoCiclo: false,
        apoioHref: proposta ? `/propostas/${proposta.id}` : null,
        apoioRotulo: proposta ? 'Revisar proposta' : null,
      },
    };
  }

  if (projeto?.status === 'concluido') {
    return {
      etapas,
      decisao: {
        rotulo: 'Entrega comprovada',
        titulo: `Abrir a próxima oportunidade com ${lead.empresa.nome}`,
        href: null,
        acao: 'Abrir novo ciclo',
        novoCiclo: true,
        apoioHref: `/solucoes/execucao/${projeto.id}`,
        apoioRotulo: 'Revisar entrega',
      },
    };
  }

  if (proposta) {
    return {
      etapas,
      decisao: {
        rotulo: proposta.status === 'aceita' ? 'Venda confirmada' : 'Decisão comercial',
        titulo:
          proposta.status === 'aceita'
            ? 'Abrir o projeto criado a partir da proposta aceita'
            : `Continuar ${proposta.titulo}`,
        href: `/propostas/${proposta.id}`,
        acao: proposta.status === 'aceita' ? 'Abrir projeto' : 'Continuar proposta',
        novoCiclo: false,
        apoioHref: proposta.reuniaoId ? `/calls/${proposta.reuniaoId}` : null,
        apoioRotulo: proposta.reuniaoId ? 'Revisar call de origem' : null,
      },
    };
  }

  if (call) {
    return {
      etapas,
      decisao: {
        rotulo: call.status === 'concluida' ? 'Conversa registrada' : 'Próxima conversa',
        titulo:
          call.status === 'concluida'
            ? 'Revisar a call e preparar a proposta'
            : `Preparar ${call.titulo}`,
        href: destinoDaCall(call),
        acao: call.status === 'concluida' ? 'Revisar pós-call' : 'Abrir call',
        novoCiclo: false,
        apoioHref:
          call.status === 'concluida'
            ? `/propostas/nova?oportunidade=${lead.oportunidade.id}&reuniao=${call.id}`
            : null,
        apoioRotulo: call.status === 'concluida' ? 'Criar proposta' : null,
      },
    };
  }

  return {
    etapas,
    decisao: {
      rotulo: 'Primeira conversa',
      titulo:
        lead.oportunidade.proximaAcao ??
        'Preparar a primeira conversa com o contexto já registrado',
      href: `/calls?nova=1&oportunidade=${lead.oportunidade.id}`,
      acao: 'Agendar call',
      novoCiclo: false,
      apoioHref: null,
      apoioRotulo: null,
    },
  };
}
