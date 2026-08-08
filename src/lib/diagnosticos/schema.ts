import { z } from 'zod';

export const CANAIS_DIAGNOSTICO = [
  'site',
  'whatsapp',
  'instagram',
  'chat',
  'email',
  'telefone',
  'outro',
] as const;

export type CanalDiagnostico = (typeof CANAIS_DIAGNOSTICO)[number];

export const ROTULO_CANAL: Record<CanalDiagnostico, string> = {
  site: 'Site e jornada pública',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  chat: 'Chat do site',
  email: 'E-mail',
  telefone: 'Telefone',
  outro: 'Outro canal',
};

const EvidenciaSchema = z.object({
  trecho: z.string().trim().min(3).max(700),
  origem: z.enum(['site', 'conversa', 'crm', 'informado']),
  fonte: z.string().trim().min(2).max(300),
});

const DimensaoSchema = z.object({
  nota: z.number().int().min(0).max(100).nullable(),
  cobertura: z.enum(['observada', 'parcial', 'nao_observada']),
  leitura: z.string().trim().min(20).max(800),
  evidencias: z.array(EvidenciaSchema).max(4),
  comoValidar: z.string().trim().min(10).max(500),
});

export const RelatorioDiagnosticoSchema = z.object({
  resumo: z.string().trim().min(40).max(1200),
  veredito: z.string().trim().min(20).max(600),
  cobertura: z.enum(['parcial', 'substancial']),
  aviso_escopo: z.string().trim().min(20).max(600),
  dimensoes: z.object({
    acesso: DimensaoSchema,
    clareza: DimensaoSchema,
    contexto: DimensaoSchema,
    continuidade: DimensaoSchema,
    confianca: DimensaoSchema,
  }),
  fatos: z
    .array(
      z.object({
        titulo: z.string().trim().min(3).max(160),
        evidencia: EvidenciaSchema,
        impacto: z.string().trim().min(10).max(600),
      }),
    )
    .max(12),
  falhas: z
    .array(
      z.object({
        titulo: z.string().trim().min(3).max(160),
        severidade: z.enum(['alta', 'media', 'baixa']),
        impacto: z.string().trim().min(10).max(600),
        evidencia: EvidenciaSchema,
      }),
    )
    .max(8),
  hipoteses: z
    .array(
      z.object({
        titulo: z.string().trim().min(3).max(160),
        explicacao: z.string().trim().min(10).max(700),
        comoValidar: z.string().trim().min(10).max(500),
      }),
    )
    .max(8),
  oportunidades: z
    .array(
      z.object({
        titulo: z.string().trim().min(3).max(160),
        impacto: z.string().trim().min(10).max(600),
        mecanismo: z.string().trim().min(10).max(700),
        evidencia_base: z.string().trim().min(10).max(600),
        projeto_slug: z.string().trim().min(1).max(180).nullable(),
        projeto_titulo: z.string().trim().min(1).max(180).nullable(),
      }),
    )
    .max(5),
  plano_correcao: z
    .array(
      z.object({
        ordem: z.number().int().min(1).max(6),
        acao: z.string().trim().min(5).max(500),
        resultado_esperado: z.string().trim().min(10).max(600),
        evidencia_conclusao: z.string().trim().min(10).max(500),
      }),
    )
    .min(1)
    .max(6),
  perguntas_descoberta: z.array(z.string().trim().min(5).max(500)).max(8),
  proxima_acao_comercial: z.object({
    acao: z.string().trim().min(5).max(500),
    porque: z.string().trim().min(10).max(700),
  }),
});

export type RelatorioDiagnostico = z.infer<typeof RelatorioDiagnosticoSchema>;
export type DimensaoDiagnostico = keyof RelatorioDiagnostico['dimensoes'];

export const DIMENSOES_DIAGNOSTICO: Array<{
  id: DimensaoDiagnostico;
  titulo: string;
  descricao: string;
}> = [
  { id: 'acesso', titulo: 'Acesso', descricao: 'Facilidade para encontrar e iniciar contato' },
  { id: 'clareza', titulo: 'Clareza', descricao: 'Capacidade de orientar sem gerar atrito' },
  { id: 'contexto', titulo: 'Contexto', descricao: 'Qualidade da descoberta e do registro' },
  {
    id: 'continuidade',
    titulo: 'Continuidade',
    descricao: 'Próximo passo e preservação do histórico',
  },
  { id: 'confianca', titulo: 'Confiança', descricao: 'Sinais que reduzem risco para o cliente' },
];

export const FonteDiagnosticoSchema = z.object({
  tipo: z.enum(['site', 'conversa', 'crm', 'informado']),
  titulo: z.string().trim().min(1).max(300),
  url: z.url().max(1000).optional(),
  status: z.enum(['lida', 'informada', 'indisponivel']),
});

export type FonteDiagnostico = z.infer<typeof FonteDiagnosticoSchema>;

export function lerRelatorioDiagnostico(valor: unknown): RelatorioDiagnostico | null {
  const leitura = RelatorioDiagnosticoSchema.safeParse(valor);
  return leitura.success ? leitura.data : null;
}

export function lerFontesDiagnostico(valor: unknown): FonteDiagnostico[] {
  const leitura = FonteDiagnosticoSchema.array().safeParse(valor);
  return leitura.success ? leitura.data : [];
}

export function calcularNotaGeral(relatorio: RelatorioDiagnostico): number | null {
  const notas = DIMENSOES_DIAGNOSTICO.flatMap(({ id }) => {
    const dimensao = relatorio.dimensoes[id];
    return dimensao.cobertura === 'nao_observada' || dimensao.nota === null ? [] : [dimensao.nota];
  });
  if (!notas.length) return null;
  return Math.round(notas.reduce((total, nota) => total + nota, 0) / notas.length);
}

export function restringirProjetosDoRelatorio(
  relatorio: RelatorioDiagnostico,
  projetos: Array<{ slug: string; titulo: string }>,
): RelatorioDiagnostico {
  const catalogo = new Map(projetos.map((projeto) => [projeto.slug, projeto.titulo]));
  return {
    ...relatorio,
    oportunidades: relatorio.oportunidades.map((oportunidade) => {
      const titulo = oportunidade.projeto_slug
        ? catalogo.get(oportunidade.projeto_slug)
        : undefined;
      return titulo
        ? { ...oportunidade, projeto_titulo: titulo }
        : { ...oportunidade, projeto_slug: null, projeto_titulo: null };
    }),
  };
}
