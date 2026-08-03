import type { Tables } from '@/lib/supabase/types.generated';

/**
 * As formas das mentorias — SEM `server-only`, de propósito.
 *
 * `queries.ts` abre com `import 'server-only'`, e a tela de mentorias é uma ilha
 * cliente (o seletor de vista, o calendário e a ficha vivem no navegador). Um
 * `import type` seria apagado na compilação, mas `TRILHAS` é VALOR: importá-lo
 * de lá arrastava o módulo de leitura inteiro para o bundle do browser e o
 * Turbopack quebrava o build com "Ecmascript file had an error", apontando para
 * `next/headers` dentro de `supabase/server`.
 *
 * O `check:fronteira` deixou passar — ele não segue a cadeia de import até um
 * `server-only` de segundo nível. Quem pegou foi o `npm run build`.
 */

/** `mentores.trilha` é CHECK de texto no banco; o tipo gerado vira `string`. */
export type TrilhaMentor = 'implementacao' | 'trafego' | 'comercial' | 'produto';

/**
 * Trilha é o eixo de leitura do calendário e o que dá identidade ao monograma do
 * mentor — sempre por INTENSIDADE de navy, nunca por cor nova. Categoria que
 * vira cor é como uma paleta ganha seis tons que ninguém aprovou.
 */
export const TRILHAS: Record<TrilhaMentor, { rotulo: string; sigla: string }> = {
  implementacao: { rotulo: 'Implementação', sigla: 'IMP' },
  trafego: { rotulo: 'Tráfego', sigla: 'TRF' },
  comercial: { rotulo: 'Comercial', sigla: 'COM' },
  produto: { rotulo: 'Produto', sigla: 'PRD' },
};

const VALORES: readonly TrilhaMentor[] = ['implementacao', 'trafego', 'comercial', 'produto'];

export function ehTrilha(valor: string): valor is TrilhaMentor {
  return (VALORES as readonly string[]).includes(valor);
}

export type MentorDaSessao = Pick<Tables<'mentores'>, 'id' | 'nome' | 'headline' | 'foto_url'> & {
  trilha: TrilhaMentor;
};

/**
 * A forma que a TELA consome — e ela mantém `inicioIso`/`fimIso` de propósito.
 *
 * O banco chama as colunas de `inicio` e `fim`, e renomear na fronteira seria a
 * escolha "limpa". Mas os componentes da agenda já falam ISO em todo lugar
 * (`rotuloDoDia(dataIso)`, `horaCurta(dataIso)`), e o sufixo é justamente o que
 * lembra quem lê que aquilo é STRING, não `Date` — `Date` não sobrevive à
 * serialização servidor→cliente.
 */
export type SessaoMentoria = {
  id: string;
  titulo: string;
  descricao: string;
  inicioIso: string;
  fimIso: string;
  vagas: number;
  salaUrl: string | null;
  mentor: MentorDaSessao;
  /** Quantas pessoas já fizeram check-in. Vem da rpc de ocupação. */
  inscritos: number;
  /** Se QUEM ESTÁ OLHANDO está inscrito. Vem da própria linha, via RLS. */
  euInscrito: boolean;
};
