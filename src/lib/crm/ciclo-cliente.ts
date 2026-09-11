import { callPodeAbrir, ROTULO_STATUS_CALL } from '@/lib/calls/tipos';
import { ROTULO_STATUS_PROJETO } from '@/lib/projetos-execucao/status';
import { ROTULO_ABRIR_PROPOSTA, ROTULO_STATUS_PROPOSTA } from '@/lib/propostas/status';
import type { DossieLead } from './dossie-types';
import { faseDaEtapa, rotuloMotivoPerda } from './etapas';
import { estaNoFluxo, ROTULO_SITUACAO } from './situacao';

export type EstadoEtapaCiclo = 'concluida' | 'atual' | 'futura' | 'encerrada';
export type EtapaCicloCliente = {
  id: 'preparar' | 'descobrir' | 'propor' | 'ganho';
  numero: string;
  rotulo: string;
  descricao: string;
  estado: EstadoEtapaCiclo;
  evidencia: string;
  href: string | null;
};
export type DecisaoCicloCliente = {
  tipo: 'navegacao' | 'enriquecer' | 'encerrado' | 'novo-ciclo' | 'definida';
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

/** A lista recebida pode estar em ordem de criação, não de agendamento. */
export function proximaReuniaoDoLead(lead: Pick<DossieLead, 'calls'>) {
  return (
    lead.calls
      .filter((call) => callPodeAbrir(call.status))
      .sort((a, b) => Date.parse(a.agendadaPara) - Date.parse(b.agendadaPara))[0] ?? null
  );
}

/**
 * A etapa vem do registro, como no Kanban. Evidências e sugestões não alteram
 * esse progresso: uma proposta pode nascer de WhatsApp ou de uma conversa offline.
 */
export function montarCicloCliente(lead: DossieLead): {
  etapas: EtapaCicloCliente[];
  decisao: DecisaoCicloCliente;
} {
  const oportunidade = lead.oportunidade;
  const proposta = lead.propostaRecente;
  const projeto = lead.projetoAtivo ?? lead.projetoRecente;
  const descoberta = lead.calls.find(
    (call) => call.tipo === 'descoberta' && call.status === 'concluida',
  );
  const temDescoberta = Boolean(lead.temDescobertaConcluida || descoberta);
  const reuniao = proximaReuniaoDoLead(lead);
  const enriquecida = Boolean(
    oportunidade.enriquecidoEm ||
    lead.enriquecimentos.some((execucao) => execucao.status === 'concluido'),
  );
  const foraDoFluxo = !estaNoFluxo(oportunidade);
  const perdida = oportunidade.etapa === 'perdido';
  const ganha = oportunidade.etapa === 'ganho';
  const fase = faseDaEtapa(oportunidade.etapa);
  const indiceAtual = ['entrada', 'conversa', 'proposta', 'ganho'].indexOf(fase);

  function estado(indice: number): EstadoEtapaCiclo {
    // A etapa anterior à perda não é conhecida. Não inventar etapas concluídas.
    if (perdida) return 'futura';
    if (indice === indiceAtual && foraDoFluxo) return 'encerrada';
    if (indice < indiceAtual || (indice === indiceAtual && ganha)) return 'concluida';
    return indice === indiceAtual ? 'atual' : 'futura';
  }

  const etapas: EtapaCicloCliente[] = [
    {
      id: 'preparar',
      numero: '01',
      rotulo: 'Preparar',
      descricao: 'Empresa, contato e contexto',
      estado: estado(0),
      evidencia: enriquecida
        ? 'Dados enriquecidos'
        : lead.continuidadePosEntrega
          ? 'Histórico de entrega disponível'
          : 'Ficha criada',
      href: `/vendas/${oportunidade.id}`,
    },
    {
      id: 'descobrir',
      numero: '02',
      rotulo: 'Descobrir',
      descricao: 'Problema, impacto e decisão',
      estado: estado(1),
      evidencia: temDescoberta
        ? 'Descoberta concluída'
        : reuniao
          ? ROTULO_STATUS_CALL[reuniao.status]
          : 'Sem reunião registrada',
      href: descoberta ? destinoDaCall(descoberta) : reuniao ? destinoDaCall(reuniao) : null,
    },
    {
      id: 'propor',
      numero: '03',
      rotulo: 'Propor',
      descricao: 'Escopo, proposta e decisão',
      estado: estado(2),
      evidencia: proposta ? ROTULO_STATUS_PROPOSTA[proposta.status] : 'Proposta a criar',
      href: proposta ? `/propostas/${proposta.id}` : null,
    },
    {
      id: 'ganho',
      numero: '04',
      rotulo: 'Ganho',
      descricao: 'Venda concluída',
      estado: estado(3),
      evidencia: projeto
        ? ROTULO_STATUS_PROJETO[projeto.status]
        : ganha
          ? 'Venda ganha'
          : 'Aguardando a venda',
      href: projeto
        ? `/entregas/${projeto.id}`
        : proposta?.status === 'aceita'
          ? `/propostas/${proposta.id}`
          : null,
    },
  ];

  function resultado(
    decisao: Partial<DecisaoCicloCliente> & Pick<DecisaoCicloCliente, 'tipo' | 'titulo'>,
  ) {
    return {
      etapas,
      decisao: {
        rotulo: 'Próximo passo sugerido',
        href: null,
        acao: null,
        prazo: null,
        apoioHref: null,
        apoioRotulo: null,
        ...decisao,
      } satisfies DecisaoCicloCliente,
    };
  }

  if (foraDoFluxo)
    return resultado({
      tipo: 'encerrado',
      rotulo: ROTULO_SITUACAO[oportunidade.situacao!],
      titulo: oportunidade.motivoRetirada ?? 'Esta oportunidade está fora do fluxo.',
    });
  if (perdida)
    return resultado({
      tipo: 'encerrado',
      rotulo: 'Venda encerrada',
      titulo: oportunidade.motivoPerda
        ? rotuloMotivoPerda(oportunidade.motivoPerda)
        : 'O histórico desta venda está preservado.',
      apoioHref: proposta ? `/propostas/${proposta.id}` : null,
      apoioRotulo: proposta ? 'Revisar proposta' : null,
    });

  // A entrega existente tem prioridade sobre compromissos antigos da venda.
  if (projeto?.status === 'concluido')
    return resultado({
      tipo: 'novo-ciclo',
      rotulo: 'Entrega concluída',
      titulo: 'Tudo entregue. Um novo projeto pode começar em outra venda.',
      apoioHref: `/entregas/${projeto.id}`,
      apoioRotulo: 'Revisar entrega',
    });
  if (projeto)
    return resultado({
      tipo: 'navegacao',
      rotulo: ROTULO_STATUS_PROJETO[projeto.status],
      titulo: projeto.titulo,
      href: `/entregas/${projeto.id}`,
      acao: 'Abrir entrega',
    });
  if (proposta?.status === 'aceita')
    return resultado({
      tipo: 'navegacao',
      rotulo: 'Proposta aceita',
      titulo: 'Prepare a entrega do projeto aprovado.',
      href: `/propostas/${proposta.id}`,
      acao: ROTULO_ABRIR_PROPOSTA[proposta.status],
    });

  if (!ganha && oportunidade.proximaAcao?.trim())
    return resultado({
      tipo: 'definida',
      rotulo: 'Próxima ação definida',
      titulo: oportunidade.proximaAcao,
      prazo: oportunidade.proximaAcaoEm,
    });
  const compromisso = lead.acoesPlano[0];
  if (!ganha && compromisso)
    return resultado({
      tipo: compromisso.reuniaoId ? 'navegacao' : 'definida',
      rotulo: 'Compromisso confirmado',
      titulo: compromisso.titulo,
      prazo: compromisso.prazoEm,
      href: compromisso.reuniaoId ? `/reunioes/${compromisso.reuniaoId}` : null,
      acao: compromisso.reuniaoId ? 'Abrir reunião' : null,
    });
  if (!ganha && reuniao)
    return resultado({
      tipo: 'navegacao',
      rotulo: 'Próxima reunião',
      titulo: reuniao.titulo,
      href: destinoDaCall(reuniao),
      acao: 'Abrir reunião',
      prazo: reuniao.agendadaPara,
    });
  if (proposta)
    return resultado({
      tipo: 'navegacao',
      rotulo: ROTULO_STATUS_PROPOSTA[proposta.status],
      titulo:
        proposta.status === 'apresentada'
          ? 'Acompanhe a resposta do cliente.'
          : proposta.status === 'pronta'
            ? 'Apresente o escopo e o investimento.'
            : proposta.status === 'recusada'
              ? 'Revise o que precisa mudar na proposta.'
              : 'Retome a proposta de onde parou.',
      href: `/propostas/${proposta.id}`,
      acao: ROTULO_ABRIR_PROPOSTA[proposta.status],
      apoioHref: descoberta ? destinoDaCall(descoberta) : null,
      apoioRotulo: descoberta ? 'Revisar reunião' : null,
    });

  if (ganha || fase === 'proposta' || temDescoberta) {
    const parametros = new URLSearchParams({ oportunidade: oportunidade.id });
    if (descoberta) parametros.set('reuniao', descoberta.id);
    if (lead.empresa.projetoSugeridoSlug)
      parametros.set('projeto', lead.empresa.projetoSugeridoSlug);
    return resultado({
      tipo: 'navegacao',
      titulo: ganha
        ? 'Registre o escopo combinado para preparar a entrega.'
        : 'Transforme o que foi combinado em uma proposta.',
      href: `/propostas/nova?${parametros.toString()}`,
      acao: ganha ? 'Registrar proposta' : 'Criar proposta',
      apoioHref: descoberta ? destinoDaCall(descoberta) : null,
      apoioRotulo: descoberta ? 'Revisar reunião' : null,
    });
  }
  if (lead.continuidadePosEntrega)
    return resultado({
      tipo: 'definida',
      rotulo: 'Próxima ação definida',
      titulo: lead.continuidadePosEntrega.proximoPasso,
      prazo: oportunidade.proximaAcaoEm,
      apoioHref: `/entregas/${lead.continuidadePosEntrega.projetoId}`,
      apoioRotulo: 'Revisar entrega',
    });
  if (!enriquecida && fase === 'entrada')
    return resultado({
      tipo: 'enriquecer',
      titulo: 'Conheça melhor a empresa antes da conversa.',
      acao: 'Enriquecer dados',
      apoioHref: `/reunioes?nova=1&oportunidade=${oportunidade.id}`,
      apoioRotulo: 'Agendar reunião',
    });
  return resultado({
    tipo: 'navegacao',
    titulo: 'Converse com o cliente sobre o problema e a prioridade.',
    href: `/reunioes?nova=1&oportunidade=${oportunidade.id}`,
    acao: 'Agendar reunião',
  });
}
