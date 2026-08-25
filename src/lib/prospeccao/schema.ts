import { z } from 'zod';

export const QUANTIDADES_PROSPECCAO = [5, 10, 20] as const;

export const BuscaProspeccaoSchema = z.object({
  segmento: z
    .string()
    .trim()
    .min(2, 'Diga que tipo de empresa você procura.')
    .max(160, 'Use até 160 caracteres.'),
  localizacao: z
    .string()
    .trim()
    .min(2, 'Informe uma cidade ou região.')
    .max(180, 'Use até 180 caracteres.'),
  quantidade: z.preprocess(
    (valor) => Number(valor),
    z.union(QUANTIDADES_PROSPECCAO.map((quantidade) => z.literal(quantidade))),
  ),
});

export type BuscaProspeccao = z.infer<typeof BuscaProspeccaoSchema>;

export const CanalContatoProspeccaoSchema = z.enum([
  'telefone',
  'whatsapp',
  'email',
  'instagram',
  'facebook',
  'linkedin',
  'x',
  'tiktok',
  'youtube',
  'pinterest',
]);

export const StatusContatoProspeccaoSchema = z.enum([
  'novo',
  'tentando_contato',
  'conversa_iniciada',
  'sem_interesse',
  'no_crm',
]);

export type CanalContatoProspeccao = z.infer<typeof CanalContatoProspeccaoSchema>;
export type StatusContatoProspeccao = z.infer<typeof StatusContatoProspeccaoSchema>;

export const RedeSocialProspeccaoSchema = z.object({
  rede: z.enum(['instagram', 'facebook', 'linkedin', 'x', 'tiktok', 'youtube', 'pinterest']),
  url: z.url().max(2048),
});

export const DecisorProspeccaoSchema = z.object({
  nome: z.string().trim().min(1).max(160),
  cargo: z.string().trim().max(180).nullable(),
  senioridade: z.string().trim().max(80).nullable(),
  linkedin_url: z.url().max(2048).nullable(),
  localizacao: z.string().trim().max(180).nullable(),
  email: z.email().max(320).nullable(),
  telefone: z.string().trim().max(80).nullable(),
  fonte: z.string().trim().min(1).max(80),
});

export const HorarioProspeccaoSchema = z.object({
  dia: z.string().trim().min(1).max(40),
  horarios: z.string().trim().min(1).max(160),
});

export const QualificacaoProspeccaoSchema = z.object({
  completude: z.number().int().min(0).max(100),
  itens: z.object({
    telefone: z.boolean(),
    email: z.boolean(),
    site: z.boolean(),
    redes_sociais: z.boolean(),
    decisores: z.boolean(),
  }),
  sinais: z.array(z.string().trim().min(1).max(180)).max(8),
  oportunidade: z
    .object({
      projeto_slug: z.enum([
        'sdr-atendimento-qualificacao',
        'maquina-prospeccao-b2b',
        'inteligencia-comercial-com-ia',
        'operacao-conteudo-multicanal',
        'radar-satisfacao-com-ia',
      ]),
      projeto_titulo: z.string().trim().min(1).max(120),
      motivo: z.string().trim().min(1).max(240),
      pergunta_abertura: z.string().trim().min(1).max(240),
      melhor_canal: z.enum(['whatsapp', 'telefone', 'email', 'linkedin', 'instagram']),
      confianca: z.enum(['alta', 'media', 'inicial']),
      evidencias: z.array(z.string().trim().min(1).max(180)).max(4),
    })
    .optional(),
});

export const LeadProspeccaoSchema = z.object({
  chave_externa: z.string().trim().min(1).max(500),
  nome: z.string().trim().min(1).max(160),
  categoria: z.string().trim().max(160).nullable(),
  endereco: z.string().trim().max(500).nullable(),
  cidade: z.string().trim().max(120).nullable(),
  estado: z.string().trim().max(80).nullable(),
  site_url: z.url().max(2048).nullable(),
  dominio: z.string().trim().max(253).nullable(),
  telefone: z.string().trim().max(80).nullable(),
  telefones: z.array(z.string().trim().min(1).max(80)).max(12),
  emails: z.array(z.email().max(320)).max(12),
  redes_sociais: z.array(RedeSocialProspeccaoSchema).max(16),
  decisores: z.array(DecisorProspeccaoSchema).max(5),
  horarios: z.array(HorarioProspeccaoSchema).max(14),
  maps_url: z.url().max(2048).nullable(),
  imagem_url: z.url().max(2048).nullable(),
  avaliacao: z.number().min(0).max(5).nullable(),
  total_avaliacoes: z.number().int().min(0).nullable(),
  descricao: z.string().trim().max(3000).nullable(),
  fontes: z.array(z.string().trim().min(1).max(80)).max(5),
  qualificacao: QualificacaoProspeccaoSchema,
  dados: z.record(z.string(), z.unknown()),
});

export type LeadProspeccaoEntrada = z.infer<typeof LeadProspeccaoSchema>;
