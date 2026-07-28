/**
 * Tipos das mentorias — ESPELHAM a futura tabela do banco.
 *
 * TODO(backend): quando `mentorias`/`mentores`/`checkins` existirem no schema,
 * estes tipos são substituídos pelos `Tables<'…'>` gerados e o módulo `index.ts`
 * (agenda de exemplo) é apagado. A UI consome só estas formas, então a troca não
 * a toca.
 *
 * Datas viajam como ISO string: o dado atravessa a fronteira servidor→cliente
 * serializado, e `Date` não sobrevive a ela.
 */

/**
 * Trilha da mentoria. É o eixo de filtro E o que dá identidade ao monograma do
 * mentor — sempre por INTENSIDADE de navy, nunca por cor nova. Categoria que
 * vira cor é como uma paleta ganha seis tons que ninguém aprovou.
 */
export type Trilha = 'implementacao' | 'trafego' | 'comercial' | 'produto';

export const TRILHAS: Record<Trilha, { rotulo: string; sigla: string }> = {
  implementacao: { rotulo: 'Implementação', sigla: 'IMP' },
  trafego: { rotulo: 'Tráfego', sigla: 'TRF' },
  comercial: { rotulo: 'Comercial', sigla: 'COM' },
  produto: { rotulo: 'Produto', sigla: 'PRD' },
};

export interface MentorExemplo {
  id: string;
  /**
   * Nome de exibição. Na DEMONSTRAÇÃO é sempre um RÓTULO DE PAPEL — nunca uma
   * pessoa inventada. Mentor fictício com nome e credencial é a mesma classe de
   * problema que depoimento fabricado: esta tela inteira se apoia em atribuição,
   * e um nome falso derruba a credibilidade de tudo que está ao lado dele.
   * Quando os mentores reais forem cadastrados, este campo recebe o nome deles.
   */
  nome: string;
  /** Uma linha de credencial — aparece ao lado do nome, nunca inventar título. */
  headline: string;
  trilha: Trilha;
  /**
   * Monograma exibido enquanto não há foto. É SIGLA, não silhueta: silhueta
   * genérica lê como "membro real cuja foto não carregou", e o CLAUDE.md proíbe
   * apresentar avatar-silhueta como pessoa.
   */
  iniciais: string;
  fotoUrl: string | null;
}

export interface MentoriaExemplo {
  id: string;
  titulo: string;
  descricao: string;
  mentorId: string;
  /** ISO com fuso. Início e fim definem AO VIVO; nada de flag manual. */
  inicioIso: string;
  fimIso: string;
  vagas: number;
  inscritos: number;
}

/** Estado derivado de UMA sessão — a matriz que o item da agenda renderiza. */
export type EstadoMentoria =
  'ao-vivo' | 'inscrito' | 'checkin-aberto' | 'lotada' | 'fora-da-janela' | 'encerrada';
