import { z } from 'zod';

export const CATEGORIAS = {
  conta: 'Conta e créditos',
  vendas: 'Prospecção e vendas',
  reunioes: 'Agenda e reuniões',
  projetos: 'Aprender e entregar',
  ia: 'Sobral AI',
  outros: 'Outros assuntos',
} as const;
export const CategoriaSchema = z.enum(['conta', 'vendas', 'reunioes', 'projetos', 'ia', 'outros']);
export const ESTADOS = {
  recebido: 'Recebido',
  em_atendimento: 'Em atendimento',
  aguardando_voce: 'Aguardando você',
  resolvido: 'Resolvido',
} as const;
export const StatusSchema = z.enum(['recebido', 'em_atendimento', 'aguardando_voce', 'resolvido']);
export const ArtigoSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{3,80}$/),
  titulo: z.string().trim().min(3).max(120),
  resumo: z.string().trim().min(3).max(800),
  categoria: CategoriaSchema,
  passos: z.array(z.string().trim().min(1).max(600)).max(8),
  dica: z.string().trim().max(1200),
  destino: z
    .string()
    .regex(
      /^\/(inicio|conta|vendas|prospeccao|propostas|reunioes|entregas|solucoes|formacoes|consultor|mentorias|certificados|suporte)(\/[a-z0-9-]+)*$/,
    ),
  tags: z.string().max(500),
  publicado: z.boolean(),
  atualizado_em: z.string(),
});
export type Artigo = z.infer<typeof ArtigoSchema>;
export const CriarSchema = z.object({
  id: z.uuid(),
  assunto: z.string().trim().min(3, 'Dê um título curto ao seu pedido.').max(120),
  categoria: CategoriaSchema,
  texto: z.string().trim().min(10, 'Conte um pouco mais sobre o que aconteceu.').max(6000),
  pagina: z.string().max(180).nullable(),
  anexos: z.array(z.uuid()).max(3),
});
export const ResponderSchema = z.object({
  id: z.uuid(),
  atendimento: z.uuid(),
  texto: z.string().trim().min(1).max(6000),
  interna: z.boolean().default(false),
  anexos: z.array(z.uuid()).max(3).default([]),
});
export const ArquivoSuporteSchema = z.object({
  id: z.uuid(),
  nome: z.string(),
  bytes: z.number(),
  mime: z.string(),
});
export type ArquivoSuporte = z.infer<typeof ArquivoSuporteSchema>;
export const ErroSuporteSchema = z.object({ erro: z.string() });
export const RespostaAjudaSchema = z.object({
  resposta: z.string().max(2400),
  fontes: z.array(z.string()).max(4),
  encaminhar: z.boolean(),
});
export type RespostaAjuda = z.infer<typeof RespostaAjudaSchema>;
export type MensagemSuporte = {
  id: string;
  texto: string;
  papel: 'usuario' | 'equipe' | 'sistema';
  interna: boolean;
  criado_em: string;
  arquivos: ArquivoSuporte[];
};
export type CasoSuporte = {
  id: string;
  numero: number;
  assunto: string;
  categoria: keyof typeof CATEGORIAS;
  status: keyof typeof ESTADOS;
  prioridade: 'normal' | 'alta';
  responsavel: string | null;
  criado_em: string;
  atualizado_em: string;
  avaliacao: number | null;
  pagina: string | null;
  email?: string;
  lido_usuario_em: string | null;
  lido_equipe_em: string | null;
};
export type AgenteSuporte = { usuario: string; nome: string; notificar: boolean };
export type ResultadoSuporte = { ok: true; id?: string } | { ok: false; erro: string };
export const MENSAGENS_POR_PAGINA = 50;
export function paginaHistorico(valor: unknown): number {
  return typeof valor === 'string' && /^\d{1,5}$/.test(valor) ? Number(valor) : 0;
}

export function paginaSegura(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const caminho = valor.split(/[?#]/)[0];
  return caminho &&
    /^\/(inicio|conta|vendas|prospeccao|propostas|reunioes|entregas|solucoes|formacoes|consultor|mentorias|certificados|suporte)(\/[a-zA-Z0-9-]+)*$/.test(
      caminho,
    )
    ? caminho.slice(0, 180)
    : null;
}
export function normalizarBusca(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
export function buscarArtigos(artigos: Artigo[], pergunta: string): Artigo[] {
  const termos = normalizarBusca(pergunta)
    .split(/\W+/)
    .filter(
      (t) =>
        t.length > 2 &&
        ![
          'como',
          'para',
          'uma',
          'com',
          'que',
          'tenho',
          'meu',
          'minha',
          'nao',
          'posso',
          'preciso',
          'esta',
        ].includes(t),
    );
  if (!termos.length) return pergunta.trim() ? [] : artigos;
  return artigos
    .map((artigo) => {
      const titulo = normalizarBusca(artigo.titulo);
      const tags = normalizarBusca(artigo.tags);
      const conteudo = normalizarBusca(
        `${artigo.resumo} ${artigo.passos.join(' ')} ${artigo.dica}`,
      );
      return {
        artigo,
        pontos: termos.reduce(
          (n, t) =>
            n +
            (titulo.includes(t) ? 5 : 0) +
            (tags.includes(t) ? 3 : 0) +
            (conteudo.includes(t) ? 1 : 0),
          0,
        ),
      };
    })
    .filter((a) => a.pontos > 0)
    .sort((a, b) => b.pontos - a.pontos)
    .map((a) => a.artigo);
}
export const MAX_ARQUIVO = 3 * 1024 * 1024;
export function tipoRealArquivo(bytes: Uint8Array): string | null {
  const inicio = Array.from(bytes.slice(0, 12));
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((n, i) => inicio[i] === n)) return 'image/png';
  if (inicio[0] === 255 && inicio[1] === 216 && inicio[2] === 255) return 'image/jpeg';
  if (
    String.fromCharCode(...inicio.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...inicio.slice(8, 12)) === 'WEBP'
  )
    return 'image/webp';
  if (String.fromCharCode(...inicio.slice(0, 5)) === '%PDF-') return 'application/pdf';
  return null;
}
