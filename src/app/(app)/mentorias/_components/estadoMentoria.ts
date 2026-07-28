import { JANELA_CHECKIN_HORAS } from '@/content/mentorias';
import type { EstadoMentoria, MentoriaExemplo } from '@/content/mentorias/types';

/**
 * Derivações puras da agenda — data/estado calculados de `agora` + a sessão.
 * Espelham as regras da futura tabela; o servidor será a fonte da verdade.
 */
export function estadoDe(
  sessao: MentoriaExemplo,
  agora: Date,
  inscritoLocal: boolean,
): EstadoMentoria {
  const inicio = new Date(sessao.inicioIso).getTime();
  const fim = new Date(sessao.fimIso).getTime();
  const t = agora.getTime();

  if (t >= fim) return 'encerrada';
  if (t >= inicio) return 'ao-vivo';
  if (inscritoLocal) return 'inscrito';
  if (sessao.inscritos >= sessao.vagas) return 'lotada';
  if (inicio - t > JANELA_CHECKIN_HORAS * 3_600_000) return 'fora-da-janela';
  return 'checkin-aberto';
}

const DIA_MS = 86_400_000;

function inicioDoDia(d: Date): number {
  const zerado = new Date(d);
  zerado.setHours(0, 0, 0, 0);
  return zerado.getTime();
}

export type RotuloDia = {
  /** "Hoje" · "Amanhã" · "Sexta-feira" */
  principal: string;
  /** "SEX · 4 JUL" — mono, fixo em pt-BR para não divergir na hidratação. */
  mono: string;
};

export function rotuloDoDia(dataIso: string, agora: Date): RotuloDia {
  const data = new Date(dataIso);
  const dias = Math.round((inicioDoDia(data) - inicioDoDia(agora)) / DIA_MS);

  const semana = data.toLocaleDateString('pt-BR', { weekday: 'long' });
  const principal =
    dias === 0 ? 'Hoje' : dias === 1 ? 'Amanhã' : semana.charAt(0).toUpperCase() + semana.slice(1);

  const curto = data
    .toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
    .replace(/\./g, '')
    .toUpperCase()
    .replace(/,?\s+/g, ' · ')
    .replace(/ · (\d)/, ' · $1');

  return { principal, mono: curto };
}

export function chaveDoDia(dataIso: string): string {
  const d = new Date(dataIso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function horaCurta(dataIso: string): string {
  return new Date(dataIso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function duracaoMin(sessao: MentoriaExemplo): number {
  return Math.round(
    (new Date(sessao.fimIso).getTime() - new Date(sessao.inicioIso).getTime()) / 60_000,
  );
}

/** "começa em 45 min" / "começa em 2h15" — some quando falta mais de um dia. */
export function comecaEm(sessao: MentoriaExemplo, agora: Date): string | null {
  const delta = new Date(sessao.inicioIso).getTime() - agora.getTime();
  if (delta <= 0 || delta > DIA_MS) return null;
  const minutos = Math.round(delta / 60_000);
  if (minutos < 60) return `começa em ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto === 0
    ? `começa em ${horas}h`
    : `começa em ${horas}h${String(resto).padStart(2, '0')}`;
}
