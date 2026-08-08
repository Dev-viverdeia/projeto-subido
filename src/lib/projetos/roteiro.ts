import { z } from 'zod';

const IdFase = z.enum(['entender', 'preparar', 'construir', 'validar', 'entregar']);

const Passo = z.object({
  id: z.string().min(2).max(80),
  titulo: z.string().min(3).max(140),
  acao: z.string().min(20).max(1200),
  concluidoQuando: z.string().min(12).max(600),
  entregavel: z.string().min(3).max(240),
});

const Fase = z.object({
  id: IdFase,
  titulo: z.string().min(3).max(40),
  objetivo: z.string().min(20).max(500),
  passos: z.array(Passo).min(1).max(8),
});

export const RoteiroProjetoSchema = z
  .object({ fases: z.array(Fase).length(5) })
  .superRefine(({ fases }, contexto) => {
    const ordem = IdFase.options;
    fases.forEach((fase, indice) => {
      if (fase.id !== ordem[indice]) {
        contexto.addIssue({
          code: 'custom',
          path: ['fases', indice, 'id'],
          message: `A fase ${indice + 1} precisa ser ${ordem[indice]}.`,
        });
      }
    });
  });

export type FaseProjeto = z.infer<typeof Fase>;
export type PassoProjeto = z.infer<typeof Passo>;
export type RoteiroProjeto = z.infer<typeof RoteiroProjetoSchema>;

/** JSONB é conteúdo administrado: dado antigo ou incompleto não derruba a página. */
export function lerRoteiroProjeto(valor: unknown): RoteiroProjeto | null {
  const resultado = RoteiroProjetoSchema.safeParse(valor);
  return resultado.success ? resultado.data : null;
}

/**
 * Identificador editorial e estável do progresso. Ele não depende do UUID da
 * linha de conteúdo, então uma revisão de texto não apaga o que a pessoa marcou.
 */
export function idPassoProjeto(slug: string, faseId: string, passoId: string): string {
  return `projeto:${slug}:${faseId}:${passoId}`;
}

export function idsPassosProjeto(slug: string, roteiro: RoteiroProjeto): string[] {
  return roteiro.fases.flatMap((fase) =>
    fase.passos.map((passo) => idPassoProjeto(slug, fase.id, passo.id)),
  );
}
