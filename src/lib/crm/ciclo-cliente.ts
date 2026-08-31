import { callPodeAbrir, ROTULO_STATUS_CALL } from '@/lib/calls/tipos';
import { ROTULO_STATUS_PROJETO } from '@/lib/projetos-execucao/status';
import { ROTULO_STATUS_PROPOSTA } from '@/lib/propostas/status';
import type { DossieLead } from './dossie-types';

export type EstadoEtapaCiclo = 'concluida' | 'atual' | 'futura' | 'encerrada';

export type EtapaCicloCliente = {
  id: 'preparar' | 'descobrir' | 'propor' | 'entregar' | 'concluir';
  numero: string;
  rotulo: string;
  descricao: string;
  estado: EstadoEtapaCiclo;
  evidencia: string;
  href: string | null;
};

export type DecisaoCicloCliente = {
  tipo: 'navegacao' | 'enriquecer' | 'encerrado' | 'novo-ciclo';
  rotulo: string;
  titulo: string;
  href: string | null;
  acao: string | null;
  prazo: string | null;
  apoioHref: string | null;
  apoioRotulo: string | null;
};

function destinoDaCall(call: DossieLead['calls'][number]): string {
  return callPodeAbrir(call.status) ? `/sala/${call.codigoPublico}` : `/reunioes/${call.id}`;
}

function estadoDaEtapa(indice: number, indiceAtual: number, encerrada: boolean): EstadoEtapaCiclo {
  if (indice < indiceAtual) return 'concluida';
  if (indice === indiceAtual) return encerrada ? 'encerrada' : 'atual';
  return 'futura';
}

/**
 * Converte fatos de um único cliente em um ciclo verificável. Um rascunho de
 * proposta não substitui a descoberta: a plataforma só recomenda propor
 * depois que uma conversa de descoberta foi concluída.
 */
export function montarCicloCliente(lead: DossieLead): {
  etapas: EtapaCicloCliente[];
  decisao: DecisaoCicloCliente;
} {
  const proposta = lead.propostaRecente;
  const projeto = lead.projetoRecente;
  const descobertaConcluida =
    lead.calls.find((call) => call.tipo === 'descoberta' && call.status === 'concluida') ?? null;
  const proximaCall =
    lead.calls.find((call) => call.status !== 'concluida' && call.status !== 'cancelada') ?? null;
  const conversaDeOrigem =
    (proposta?.reuniaoId ? lead.calls.find((call) => call.id === proposta.reuniaoId) : undefined) ??
    descobertaConcluida;
  const contextoEnriquecido = Boolean(
    lead.oportunidade.enriquecidoEm ||
    lead.enriquecimentos.some((execucao) => execucao.status === 'concluido') ||
    lead.continuidadePosEntrega,
  );
  const concluido = projeto?.status === 'concluido';
  const entregaIniciada = Boolean(lead.projetoAtivo || proposta?.status === 'aceita');
  const propostaAprovada = proposta?.status === 'aceita';
  const encerrada = lead.oportunidade.etapa === 'perdido' || proposta?.status === 'recusada';
  const preparacaoPendente =
    !contextoEnriquecido && !proximaCall && !descobertaConcluida && !proposta && !encerrada;

  let indiceAtual = preparacaoPendente ? 0 : 1;
  if (concluido) indiceAtual = 4;
  else if (entregaIniciada || lead.oportunidade.etapa === 'ganho') indiceAtual = 3;
  else if (descobertaConcluida) indiceAtual = 2;

  if (encerrada) {
    if (proposta) indiceAtual = 2;
    else if (descobertaConcluida) indiceAtual = 1;
    else indiceAtual = 0;
  }

  const etapas: EtapaCicloCliente[] = [
    {
      id: 'preparar',
      numero: '01',
      rotulo: 'Preparar',
      descricao: 'Empresa, contato e contexto',
      estado: estadoDaEtapa(0, indiceAtual, encerrada),
      evidencia: contextoEnriquecido
        ? 'Dados enriquecidos'
        : preparacaoPendente
          ? 'Enriquecimento recomendado'
          : 'Ficha criada',
      href: `/vendas/${lead.oportunidade.id}`,
    },
    {
      id: 'descobrir',
      numero: '02',
      rotulo: 'Descobrir',
      descricao: 'Problema, impacto e decisão',
      estado: estadoDaEtapa(1, indiceAtual, encerrada),
      evidencia: descobertaConcluida
        ? 'Descoberta concluída'
        : proximaCall
          ? ROTULO_STATUS_CALL[proximaCall.status]
          : 'Reunião pendente',
      href: descobertaConcluida
        ? destinoDaCall(descobertaConcluida)
        : proximaCall
          ? destinoDaCall(proximaCall)
          : null,
    },
    {
      id: 'propor',
      numero: '03',
      rotulo: 'Propor',
      descricao: 'Escopo, proposta e decisão',
      estado: estadoDaEtapa(2, indiceAtual, encerrada),
      evidencia: proposta ? ROTULO_STATUS_PROPOSTA[proposta.status] : 'Ainda não criada',
      href: proposta ? `/propostas/${proposta.id}` : null,
    },
    {
      id: 'entregar',
      numero: '04',
      rotulo: 'Entregar',
      descricao: 'Kickoff, execução e validação',
      estado: estadoDaEtapa(3, indiceAtual, encerrada),
      evidencia: projeto
        ? ROTULO_STATUS_PROJETO[projeto.status]
        : propostaAprovada
          ? 'Projeto pronto para iniciar'
          : 'Aguardando a venda',
      href: projeto
        ? `/entregas/${projeto.id}`
        : propostaAprovada && proposta
          ? `/propostas/${proposta.id}`
          : null,
    },
    {
      id: 'concluir',
      numero: '05',
      rotulo: 'Concluir',
      descricao: 'Aceite, resultado e próximo ciclo',
      estado: estadoDaEtapa(4, indiceAtual, encerrada),
      evidencia: concluido ? 'Entrega comprovada' : 'Ainda não concluída',
      href: concluido && projeto ? `/entregas/${projeto.id}` : null,
    },
  ];

  if (encerrada) {
    return {
      etapas,
      decisao: {
        tipo: 'encerrado',
        rotulo: 'Venda encerrada',
        titulo: 'O motivo da perda fica salvo para orientar uma abordagem futura.',
        href: null,
        acao: null,
        prazo: null,
        apoioHref: proposta ? `/propostas/${proposta.id}` : null,
        apoioRotulo: proposta ? 'Revisar proposta' : null,
      },
    };
  }

  const compromisso = lead.acoesPlano[0] ?? null;
  if (compromisso && !lead.projetoAtivo) {
    return {
      etapas,
      decisao: {
        tipo: 'navegacao',
        rotulo: 'Compromisso confirmado',
        titulo: compromisso.titulo,
        href: compromisso.reuniaoId
          ? `/reunioes/${compromisso.reuniaoId}`
          : `/vendas/${lead.oportunidade.id}`,
        acao: compromisso.reuniaoId ? 'Abrir reunião' : 'Abrir em Vendas',
        prazo: compromisso.prazoEm,
        apoioHref: null,
        apoioRotulo: null,
      },
    };
  }

  if (lead.projetoAtivo) {
    return {
      etapas,
      decisao: {
        tipo: 'navegacao',
        rotulo: 'Entrega em andamento',
        titulo: `Continuar ${lead.projetoAtivo.titulo}`,
        href: `/entregas/${lead.projetoAtivo.id}`,
        acao: 'Continuar entrega',
        prazo: null,
        apoioHref: proposta ? `/propostas/${proposta.id}` : null,
        apoioRotulo: proposta ? 'Revisar proposta' : null,
      },
    };
  }

  if (concluido && projeto) {
    return {
      etapas,
      decisao: {
        tipo: 'novo-ciclo',
        rotulo: 'Primeiro ciclo concluído',
        titulo: `A entrega de ${lead.empresa.nome} está salva. Abra outra venda quando houver um novo projeto.`,
        href: null,
        acao: null,
        prazo: null,
        apoioHref: `/entregas/${projeto.id}`,
        apoioRotulo: 'Revisar entrega',
      },
    };
  }

  if (propostaAprovada && proposta) {
    return {
      etapas,
      decisao: {
        tipo: 'navegacao',
        rotulo: 'Venda confirmada',
        titulo: 'Abra a proposta aceita para iniciar a entrega do projeto.',
        href: `/propostas/${proposta.id}`,
        acao: 'Iniciar entrega',
        prazo: null,
        apoioHref: conversaDeOrigem ? destinoDaCall(conversaDeOrigem) : null,
        apoioRotulo: conversaDeOrigem ? 'Revisar reunião' : null,
      },
    };
  }

  if (proximaCall) {
    return {
      etapas,
      decisao: {
        tipo: 'navegacao',
        rotulo: 'Próxima conversa',
        titulo: `Prepare ${proximaCall.titulo}`,
        href: destinoDaCall(proximaCall),
        acao: 'Abrir reunião',
        prazo: lead.oportunidade.proximaAcaoEm ?? proximaCall.agendadaPara,
        apoioHref: null,
        apoioRotulo: null,
      },
    };
  }

  if (descobertaConcluida) {
    if (proposta) {
      return {
        etapas,
        decisao: {
          tipo: 'navegacao',
          rotulo: 'Proposta em andamento',
          titulo: `Continuar ${proposta.titulo}`,
          href: `/propostas/${proposta.id}`,
          acao: 'Continuar proposta',
          prazo: lead.oportunidade.proximaAcaoEm,
          apoioHref: destinoDaCall(descobertaConcluida),
          apoioRotulo: 'Revisar descoberta',
        },
      };
    }

    const parametrosProposta = new URLSearchParams({
      oportunidade: lead.oportunidade.id,
      reuniao: descobertaConcluida.id,
    });
    if (lead.empresa.projetoSugeridoSlug) {
      parametrosProposta.set('projeto', lead.empresa.projetoSugeridoSlug);
    }

    return {
      etapas,
      decisao: {
        tipo: 'navegacao',
        rotulo: 'Descoberta concluída',
        titulo: 'Use o que foi confirmado na reunião para montar a proposta.',
        href: `/propostas/nova?${parametrosProposta.toString()}`,
        acao: 'Montar proposta',
        prazo: lead.oportunidade.proximaAcaoEm,
        apoioHref: destinoDaCall(descobertaConcluida),
        apoioRotulo: 'Revisar descoberta',
      },
    };
  }

  if (lead.continuidadePosEntrega) {
    return {
      etapas,
      decisao: {
        tipo: 'navegacao',
        rotulo:
          lead.continuidadePosEntrega.decisao === 'expandir'
            ? 'Expansão confirmada'
            : 'Novo projeto sinalizado',
        titulo: lead.continuidadePosEntrega.proximoPasso,
        href: `/reunioes?nova=1&oportunidade=${lead.oportunidade.id}`,
        acao: 'Agendar reunião',
        prazo: lead.oportunidade.proximaAcaoEm,
        apoioHref: `/entregas/${lead.continuidadePosEntrega.projetoId}`,
        apoioRotulo: 'Revisar entrega',
      },
    };
  }

  if (!contextoEnriquecido && !proposta) {
    return {
      etapas,
      decisao: {
        tipo: 'enriquecer',
        rotulo: 'Antes da primeira conversa',
        titulo:
          'Enriqueça a ficha para receber contexto, perguntas de descoberta e projetos para explorar.',
        href: null,
        acao: 'Enriquecer dados',
        prazo: null,
        apoioHref: `/reunioes?nova=1&oportunidade=${lead.oportunidade.id}`,
        apoioRotulo: 'Agendar sem enriquecer',
      },
    };
  }

  return {
    etapas,
    decisao: {
      tipo: 'navegacao',
      rotulo: proposta ? 'Descoberta pendente' : 'Primeira conversa',
      titulo: proposta
        ? 'O rascunho está salvo. Faça a descoberta antes de apresentar uma solução.'
        : (lead.oportunidade.proximaAcao ??
          'Agende uma conversa para entender o problema, o impacto e quem decide.'),
      href: `/reunioes?nova=1&oportunidade=${lead.oportunidade.id}`,
      acao: 'Agendar descoberta',
      prazo: lead.oportunidade.proximaAcaoEm,
      apoioHref: proposta ? `/propostas/${proposta.id}` : null,
      apoioRotulo: proposta ? 'Abrir rascunho' : null,
    },
  };
}
