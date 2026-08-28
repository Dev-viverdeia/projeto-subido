import type { ResumoProjetoExecucao } from './queries';

const UM_DIA = 86_400_000;
const FUSO = 'America/Sao_Paulo';

export type TipoPrioridadeEntrega =
  | 'ajustes'
  | 'bloqueada'
  | 'atrasada'
  | 'pausada'
  | 'aguardando_cliente'
  | 'vence_em_breve'
  | 'sem_prazo'
  | 'no_prazo'
  | 'concluida';

export type PrioridadeEntrega = {
  tipo: TipoPrioridadeEntrega;
  ordem: number;
  grupo: 'acao' | 'cliente' | 'ritmo' | 'historico';
  rotulo: string;
  detalhe: string;
};

function inicioDoDia(valor: Date): number {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(valor);
  const ler = (tipo: Intl.DateTimeFormatPartTypes) =>
    Number(partes.find((parte) => parte.type === tipo)?.value ?? 0);

  return Date.UTC(ler('year'), ler('month') - 1, ler('day'));
}

function diasAte(valor: string, agora: Date): number {
  return Math.round((inicioDoDia(new Date(valor)) - inicioDoDia(agora)) / UM_DIA);
}

function plural(valor: number, singular: string, pluralizado: string): string {
  return `${valor} ${valor === 1 ? singular : pluralizado}`;
}

export function classificarPrioridadeEntrega(
  projeto: ResumoProjetoExecucao,
  agora = new Date(),
): PrioridadeEntrega {
  if (projeto.status === 'concluido') {
    return {
      tipo: 'concluida',
      ordem: 90,
      grupo: 'historico',
      rotulo: 'Entregue',
      detalhe: 'Aceite final registrado',
    };
  }

  if (projeto.ajustesSolicitados > 0) {
    return {
      tipo: 'ajustes',
      ordem: 0,
      grupo: 'acao',
      rotulo: 'Ajustes solicitados',
      detalhe: `${plural(projeto.ajustesSolicitados, 'item', 'itens')} para revisar`,
    };
  }

  if (projeto.tarefasBloqueadas > 0) {
    return {
      tipo: 'bloqueada',
      ordem: 1,
      grupo: 'acao',
      rotulo: 'Entrega bloqueada',
      detalhe: `${plural(projeto.tarefasBloqueadas, 'tarefa', 'tarefas')} sem avanço`,
    };
  }

  if (projeto.status === 'pausado') {
    return {
      tipo: 'pausada',
      ordem: 6,
      grupo: 'ritmo',
      rotulo: 'Projeto pausado',
      detalhe: 'Retome quando houver condição de seguir',
    };
  }

  const prazoOperacional = projeto.proximaAcaoPrazoEm ?? projeto.prazoEm;
  const dias = prazoOperacional ? diasAte(prazoOperacional, agora) : null;

  if (dias !== null && dias < 0) {
    const atraso = Math.abs(dias);
    return {
      tipo: 'atrasada',
      ordem: 2,
      grupo: 'acao',
      rotulo: projeto.proximaAcaoPrazoEm ? 'Próxima ação atrasada' : 'Prazo vencido',
      detalhe: `Atraso de ${plural(atraso, 'dia', 'dias')}`,
    };
  }

  if (projeto.validacoesAguardando > 0 || projeto.status === 'em_validacao') {
    const validacoes = Math.max(projeto.validacoesAguardando, 1);
    return {
      tipo: 'aguardando_cliente',
      ordem: 3,
      grupo: 'cliente',
      rotulo: 'Aguardando o cliente',
      detalhe: `${plural(validacoes, 'validação', 'validações')} ${validacoes === 1 ? 'pendente' : 'pendentes'}`,
    };
  }

  if (dias !== null && dias <= 3) {
    return {
      tipo: 'vence_em_breve',
      ordem: 4,
      grupo: 'acao',
      rotulo: dias === 0 ? 'Prazo hoje' : dias === 1 ? 'Prazo amanhã' : `Prazo em ${dias} dias`,
      detalhe: projeto.proximaAcaoPrazoEm
        ? 'Conclua a próxima ação'
        : 'Revise o que falta entregar',
    };
  }

  if (!projeto.prazoEm) {
    return {
      tipo: 'sem_prazo',
      ordem: 5,
      grupo: 'acao',
      rotulo: 'Prazo não definido',
      detalhe: 'Combine a data com o cliente',
    };
  }

  return {
    tipo: 'no_prazo',
    ordem: 7,
    grupo: 'ritmo',
    rotulo: 'No prazo',
    detalhe: dias === null ? 'Siga pela próxima tarefa' : `Restam ${plural(dias, 'dia', 'dias')}`,
  };
}

export function ordenarEntregasPorPrioridade(
  projetos: ResumoProjetoExecucao[],
  agora = new Date(),
): ResumoProjetoExecucao[] {
  return [...projetos].sort((a, b) => {
    const prioridadeA = classificarPrioridadeEntrega(a, agora);
    const prioridadeB = classificarPrioridadeEntrega(b, agora);
    if (prioridadeA.ordem !== prioridadeB.ordem) return prioridadeA.ordem - prioridadeB.ordem;

    const prazoA = a.proximaAcaoPrazoEm ?? a.prazoEm;
    const prazoB = b.proximaAcaoPrazoEm ?? b.prazoEm;
    if (prazoA && prazoB) return prazoA.localeCompare(prazoB);
    if (prazoA) return -1;
    if (prazoB) return 1;
    return b.atualizadoEm.localeCompare(a.atualizadoEm);
  });
}
