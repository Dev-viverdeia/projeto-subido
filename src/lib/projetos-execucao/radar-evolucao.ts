import type { EvolucaoProjeto } from './evolucao';

export type StatusRadarEvolucao = 'vencida' | 'hoje' | 'proxima' | 'agendada' | 'registrada';

export type SinalRadarEvolucao = {
  status: StatusRadarEvolucao;
  dias: number;
  rotulo: string;
  detalhe: string;
  prioridade: number;
};

function dataLocalISO(agora: Date): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).formatToParts(agora);
  const valor = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((parte) => parte.type === tipo)?.value ?? '';
  return `${valor('year')}-${valor('month')}-${valor('day')}`;
}

function diasEntreDatas(inicio: string, fim: string): number {
  const paraUTC = (valor: string) =>
    Date.UTC(Number(valor.slice(0, 4)), Number(valor.slice(5, 7)) - 1, Number(valor.slice(8, 10)));
  return Math.round((paraUTC(fim) - paraUTC(inicio)) / 86_400_000);
}

export function classificarRevisaoEvolucao(
  evolucao: EvolucaoProjeto,
  agora = new Date(),
): SinalRadarEvolucao {
  if (evolucao.status === 'registrada') {
    return {
      status: 'registrada',
      dias: 0,
      rotulo: 'Resultado registrado',
      detalhe: 'A decisão e o próximo passo já foram definidos.',
      prioridade: 5,
    };
  }

  const dias = diasEntreDatas(dataLocalISO(agora), evolucao.revisaoEm);

  if (dias < 0) {
    const atraso = Math.abs(dias);
    return {
      status: 'vencida',
      dias,
      rotulo: atraso === 1 ? 'Atrasada há 1 dia' : `Atrasada há ${atraso} dias`,
      detalhe: 'Registre o resultado e combine o que acontece depois.',
      prioridade: 1,
    };
  }

  if (dias === 0) {
    return {
      status: 'hoje',
      dias,
      rotulo: 'Revisão hoje',
      detalhe: 'Converse com o cliente e feche o próximo passo.',
      prioridade: 2,
    };
  }

  if (dias <= 7) {
    return {
      status: 'proxima',
      dias,
      rotulo: dias === 1 ? 'Revisão amanhã' : `Revisão em ${dias} dias`,
      detalhe: 'Prepare a conversa com os resultados da operação.',
      prioridade: 3,
    };
  }

  return {
    status: 'agendada',
    dias,
    rotulo: `Revisão em ${dias} dias`,
    detalhe: 'O acompanhamento já está marcado.',
    prioridade: 4,
  };
}

export function ordenarRevisoesEvolucao<T extends { evolucao?: EvolucaoProjeto | null }>(
  projetos: T[],
  agora = new Date(),
): T[] {
  return projetos
    .filter((projeto) => projeto.evolucao)
    .sort((a, b) => {
      const sinalA = classificarRevisaoEvolucao(a.evolucao!, agora);
      const sinalB = classificarRevisaoEvolucao(b.evolucao!, agora);
      return sinalA.prioridade - sinalB.prioridade || sinalA.dias - sinalB.dias;
    });
}
