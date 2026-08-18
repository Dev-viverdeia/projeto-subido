import { z } from 'zod';
import { EtapaSobralSchema } from './etapas';

const FocoSchema = z
  .object({
    oportunidadeId: z.uuid(),
    titulo: z.string(),
    empresa: z.string(),
    etapa: z.string(),
    proximaAcao: z.string().nullable(),
    proximaAcaoEm: z.string().nullable(),
  })
  .nullable();

export const SinaisSobralSchema = z.object({
  momento: z.string(),
  oportunidades: z.object({
    total: z.number().int().nonnegative(),
    abertas: z.number().int().nonnegative(),
    semProximaAcao: z.number().int().nonnegative(),
    emDescoberta: z.number().int().nonnegative(),
    emPropostaOuNegociacao: z.number().int().nonnegative(),
    ganhas: z.number().int().nonnegative(),
  }),
  calls: z.object({
    total: z.number().int().nonnegative(),
    agendadas: z.number().int().nonnegative(),
    concluidas: z.number().int().nonnegative(),
  }),
  propostas: z.object({
    total: z.number().int().nonnegative(),
    rascunhos: z.number().int().nonnegative(),
    prontas: z.number().int().nonnegative(),
    apresentadas: z.number().int().nonnegative(),
    aceitas: z.number().int().nonnegative(),
  }),
  studio: z.object({
    total: z.number().int().nonnegative(),
    prontos: z.number().int().nonnegative(),
  }),
  projetos: z.object({
    total: z.number().int().nonnegative(),
    ativos: z.number().int().nonnegative(),
    acoesPendentes: z.number().int().nonnegative(),
    acoesAtrasadas: z.number().int().nonnegative(),
  }),
  jornada: z
    .object({
      perfilCompleto: z.boolean(),
      etapaAtual: EtapaSobralSchema,
      proximoPasso: z.object({
        id: z.string().min(2),
        titulo: z.string().min(3),
        detalhe: z.string().min(10),
        evidencia: z.string().min(3),
        destino: z.string().startsWith('/'),
        acao: z.string().min(3),
      }),
      evidenciasConcluidas: z.number().int().nonnegative(),
      totalEvidencias: z.number().int().nonnegative(),
      percentual: z.number().int().min(0).max(100),
      aprendizado: z.object({
        aulasConcluidas: z.number().int().nonnegative(),
        formacoesConcluidas: z.number().int().nonnegative(),
        etapasConcluidas: z.number().int().nonnegative(),
        projetosConcluidos: z.number().int().nonnegative(),
      }),
    })
    .default({
      perfilCompleto: false,
      etapaAtual: 'aprender',
      proximoPasso: {
        id: 'configurar-direcao',
        titulo: 'Definir a primeira oferta',
        detalhe: 'Escolha o mercado, o primeiro projeto e a frase usada para explicar o serviço.',
        evidencia: 'Mercado, projeto e apresentação do serviço salvos.',
        destino: '/inicio',
        acao: 'Definir oferta',
      },
      evidenciasConcluidas: 0,
      totalEvidencias: 0,
      percentual: 0,
      aprendizado: {
        aulasConcluidas: 0,
        formacoesConcluidas: 0,
        etapasConcluidas: 0,
        projetosConcluidos: 0,
      },
    }),
  radar: z
    .array(
      z.object({
        id: z.string().min(3),
        dominio: z.enum(['crm', 'calls', 'propostas', 'projetos', 'plano']),
        titulo: z.string().trim().min(3).max(180),
        contexto: z.string().trim().min(2).max(240),
        momento: z.string().trim().min(2).max(120),
        estado: z.enum(['ao_vivo', 'atrasado', 'hoje', 'agendado', 'aguardando', 'sem_prazo']),
        destino: z.string().startsWith('/'),
        prioridade: z.number().int().nonnegative(),
      }),
    )
    .max(4),
  catalogo: z.array(
    z.object({ slug: z.string(), titulo: z.string(), categoria: z.string().nullable() }),
  ),
  foco: FocoSchema,
});

export type SinaisSobral = z.infer<typeof SinaisSobralSchema>;
