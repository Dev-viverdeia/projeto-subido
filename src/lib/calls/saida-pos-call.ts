import type { PosCall } from './queries';

export type SaidaPosCall = {
  tipo: 'proposta' | 'projeto' | 'crm';
  rotulo: string;
  titulo: string;
  descricao: string;
  acao: string;
  href: string;
};

const CALLS_COMERCIAIS = new Set<PosCall['reuniao']['tipo']>([
  'descoberta',
  'follow_up',
  'proposta',
]);

/**
 * Decide uma única continuidade para a conversa. A saída usa apenas fatos já
 * persistidos; não cria projeto nem avança o pipeline sem revisão humana.
 */
export function montarSaidaPosCall(posCall: PosCall): SaidaPosCall {
  const proposta = posCall.sincronizacao.propostaDaCall;
  if (proposta) {
    return {
      tipo: 'proposta',
      rotulo: 'Proposta conectada',
      titulo: `Continuar ${proposta.titulo}`,
      descricao: 'Este documento nasceu desta conversa e preserva os fatos usados no rascunho.',
      acao: 'Abrir proposta',
      href: `/propostas/${proposta.id}?origem=call`,
    };
  }

  const projeto = posCall.sincronizacao.projetoAtivo;
  const callDeEntrega = posCall.reuniao.tipo === 'kickoff' || posCall.reuniao.tipo === 'entrega';
  if (projeto && (callDeEntrega || posCall.oportunidade.etapa === 'ganho')) {
    const temBriefing =
      posCall.reuniao.tipo === 'kickoff' && Boolean(posCall.analise?.briefingOperacional);
    return {
      tipo: 'projeto',
      rotulo: temBriefing ? 'Briefing preparado' : 'Entrega em andamento',
      titulo: temBriefing
        ? `Revisar o briefing em ${projeto.titulo}`
        : `Continuar ${projeto.titulo}`,
      descricao: temBriefing
        ? 'Objetivo, responsáveis, acessos e limites estão prontos para sua revisão no projeto.'
        : 'A conversa continua na execução, junto do escopo, das ações e das evidências do cliente.',
      acao: 'Abrir projeto',
      href: `/solucoes/execucao/${projeto.id}${temBriefing ? '#briefing-kickoff' : ''}`,
    };
  }

  const analisePronta = posCall.analise?.status === 'concluida' && Boolean(posCall.analise.resumo);
  const oportunidadeAberta =
    posCall.oportunidade.etapa !== 'ganho' && posCall.oportunidade.etapa !== 'perdido';
  if (CALLS_COMERCIAIS.has(posCall.reuniao.tipo) && analisePronta && oportunidadeAberta) {
    return {
      tipo: 'proposta',
      rotulo: 'Próxima decisão comercial',
      titulo: 'Criar uma proposta a partir desta conversa',
      descricao:
        'As informações confirmadas entram no rascunho. Você ainda revisa escopo, investimento e texto antes de enviar.',
      acao: 'Preparar proposta',
      href: `/propostas/nova?oportunidade=${posCall.oportunidade.id}&reuniao=${posCall.reuniao.id}`,
    };
  }

  const processando =
    posCall.reuniao.status === 'processando' ||
    (!posCall.analise && posCall.reuniao.status === 'concluida');
  return {
    tipo: 'crm',
    rotulo: 'Próxima ação no CRM',
    titulo: processando ? 'Aguardar a análise antes de propor' : 'Registrar o próximo contato',
    descricao: processando
      ? 'A conversa já foi salva. Assim que a análise terminar, você poderá decidir o próximo passo.'
      : 'Use o histórico e o plano da call para acompanhar o lead antes de criar uma proposta.',
    acao: 'Abrir oportunidade',
    href: `/crm/${posCall.oportunidade.id}`,
  };
}
