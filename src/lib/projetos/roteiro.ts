import { z } from 'zod';

const IdFase = z.enum(['entender', 'preparar', 'construir', 'validar', 'entregar']);

const Fundamento = z.object({
  titulo: z.string().min(3).max(80),
  descricao: z.string().min(20).max(400),
});

const ModeloPronto = z.object({
  titulo: z.string().min(3).max(100),
  conteudo: z.string().min(20).max(6000),
});

const PerfilProjeto = z.object({
  nivel: z.enum(['entrada', 'intermediario', 'avancado']),
  prazo: z.string().min(3).max(80),
  formatoPiloto: z.string().min(12).max(240),
  primeiraProva: z.string().min(20).max(500),
  recomendadoParaComecar: z.boolean().default(false),
});

const EscopoProjeto = z.object({
  inclui: z.array(z.string().min(8).max(240)).min(3).max(6),
  preRequisitos: z.array(z.string().min(8).max(240)).min(2).max(6),
  naoInclui: z.array(z.string().min(8).max(240)).min(2).max(6),
  evolucoes: z.array(z.string().min(8).max(240)).min(1).max(5),
});

const ArtefatoEntrega = z.object({
  titulo: z.string().min(3).max(100),
  descricao: z.string().min(12).max(300),
});

const RecursoAula = z
  .object({
    tipo: z.enum(['mapa_mental', 'quiz', 'ebook', 'modelo']),
    titulo: z.string().min(3).max(120),
    descricao: z.string().min(12).max(300),
    url: z.string().url().max(1000).optional(),
    conteudo: z.string().min(20).max(12000).optional(),
  })
  .refine((recurso) => Boolean(recurso.url || recurso.conteudo), {
    message: 'O recurso precisa ter um link ou conteúdo.',
  });

const AulaCampo = z.object({
  titulo: z.string().min(3).max(120),
  objetivo: z.string().min(20).max(400),
  duracao: z.string().min(2).max(40),
  topicos: z.array(z.string().min(8).max(240)).min(2).max(5),
  exercicio: z.string().min(20).max(500),
  prontoQuando: z.string().min(20).max(500),
  recursos: z.array(RecursoAula).max(4).optional(),
});

const VideoReferencia = z.object({
  titulo: z.string().min(3).max(120),
  descricao: z.string().min(20).max(400),
  videoUrl: z.string().url().max(1000),
});

const PassoDemonstracao = z.object({
  etapa: z.string().min(3).max(80),
  oQueAcontece: z.string().min(12).max(400),
  evidencia: z.string().min(8).max(240),
});

const DemonstracaoCampo = z.object({
  titulo: z.string().min(3).max(120),
  contexto: z.string().min(20).max(500),
  passos: z.array(PassoDemonstracao).min(4).max(8),
  resultadoEsperado: z.string().min(20).max(500),
});

const MaterialCampo = z.object({
  titulo: z.string().min(3).max(100),
  quandoUsar: z.string().min(12).max(300),
  conteudo: z.string().min(20).max(8000),
});

const TrilhaDidatica = z.object({
  tempoTotal: z.string().min(2).max(80),
  aulas: z.array(AulaCampo).min(2).max(4),
  videosReferencia: z.array(VideoReferencia).max(3).default([]),
  demonstracao: DemonstracaoCampo,
  materiais: z.array(MaterialCampo).min(3).max(6),
});

const Passo = z.object({
  id: z.string().min(2).max(80),
  titulo: z.string().min(3).max(140),
  acao: z.string().min(20).max(1200),
  concluidoQuando: z.string().min(12).max(600),
  entregavel: z.string().min(3).max(240),
  duracao: z.string().min(2).max(60).optional(),
  insumos: z.array(z.string().min(3).max(240)).max(8).default([]),
  execucao: z.array(z.string().min(8).max(600)).max(10).default([]),
  atencao: z.string().min(12).max(600).optional(),
  modelo: ModeloPronto.optional(),
});

const Fase = z.object({
  id: IdFase,
  titulo: z.string().min(3).max(40),
  objetivo: z.string().min(20).max(500),
  passos: z.array(Passo).min(1).max(8),
});

export const RoteiroProjetoSchema = z
  .object({
    fundamentos: z.array(Fundamento).max(4).default([]),
    perfil: PerfilProjeto.optional(),
    escopo: EscopoProjeto.optional(),
    artefatosEntrega: z.array(ArtefatoEntrega).min(3).max(6).optional(),
    trilhaDidatica: TrilhaDidatica.optional(),
    fases: z.array(Fase).length(5),
  })
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

/**
 * As aulas de campo vivem no roteiro do projeto, não na tabela de aulas das
 * formações. A posição faz parte do contrato editorial do minicurso: revisar o
 * texto não apaga a conclusão já registrada pela pessoa.
 */
export function idAulaProjeto(slug: string, indice: number): string {
  return `projeto:${slug}:aprender:aula-${String(indice + 1).padStart(2, '0')}`;
}

export function idsAulasProjeto(slug: string, roteiro: RoteiroProjeto): string[] {
  return (roteiro.trilhaDidatica?.aulas ?? []).map((_, indice) => idAulaProjeto(slug, indice));
}

export function idsPassosProjeto(slug: string, roteiro: RoteiroProjeto): string[] {
  return roteiro.fases.flatMap((fase) =>
    fase.passos.map((passo) => idPassoProjeto(slug, fase.id, passo.id)),
  );
}
