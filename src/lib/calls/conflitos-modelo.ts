import { dataLocalParaUtc } from './agenda-modelo';

export type ConflitoHorario = {
  inicio: string;
  duracao: number;
  confirmacao: string;
  total: number;
  reunioes: { id: string; titulo: string; inicio: string; duracao: number }[];
  alternativas?: string[];
};

export function conflitoDoHorario(
  conflito: ConflitoHorario | undefined,
  dataLocal: string,
  duracao: string,
): ConflitoHorario | undefined {
  if (!conflito) return;
  const inicio = dataLocalParaUtc(dataLocal, new Date(dataLocal).getTimezoneOffset());
  return inicio?.toISOString() === conflito.inicio && Number(duracao) === conflito.duracao
    ? conflito
    : undefined;
}
