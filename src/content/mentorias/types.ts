/**
 * Tipos das mentorias — ESPELHAM a futura tabela do banco.
 *
 * TODO(backend): quando `mentorias`/`checkins` existirem no schema, estes tipos
 * são substituídos pelos `Tables<'…'>` gerados e o módulo `index.ts` (agenda de
 * exemplo) é apagado. A UI consome só estas formas, então a troca não a toca.
 *
 * Datas viajam como ISO string: o dado atravessa a fronteira servidor→cliente
 * serializado, e `Date` não sobrevive a ela.
 */
export interface MentorExemplo {
  nome: string;
  /** Uma linha de credencial — aparece ao lado do nome, nunca inventar título. */
  headline: string;
}

export interface MentoriaExemplo {
  id: string;
  titulo: string;
  descricao: string;
  mentor: MentorExemplo;
  /** ISO com fuso. Início e fim definem AO VIVO; nada de flag manual. */
  inicioIso: string;
  fimIso: string;
  vagas: number;
  inscritos: number;
}

/** Estado derivado de UMA sessão — a matriz que o item da agenda renderiza. */
export type EstadoMentoria =
  'ao-vivo' | 'inscrito' | 'checkin-aberto' | 'lotada' | 'fora-da-janela' | 'encerrada';
