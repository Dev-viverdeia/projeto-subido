const UM_DIA = 86_400_000;
const FUSO = 'America/Sao_Paulo';

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

export function diasAtePrazo(valor: string, agora = new Date()): number {
  return Math.round((inicioDoDia(new Date(valor)) - inicioDoDia(agora)) / UM_DIA);
}

export function prazoEstaAtrasado(valor: string | null, agora = new Date()): boolean {
  return Boolean(valor && diasAtePrazo(valor, agora) < 0);
}

export function rotuloPrazoOperacional(valor: string, agora = new Date()): string {
  const dias = diasAtePrazo(valor, agora);
  if (dias < 0) {
    const atraso = Math.abs(dias);
    return `Atrasada há ${atraso} ${atraso === 1 ? 'dia' : 'dias'}`;
  }
  if (dias === 0) return 'Prazo hoje';
  if (dias === 1) return 'Prazo amanhã';
  return `Prazo em ${dias} dias`;
}

export function formatarDataProjeto(valor: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: FUSO,
  })
    .format(new Date(valor))
    .replace('.', '');
}
