import { z } from 'zod';
import { EdicaoPropostaSchema } from './edicao';
import { DocumentoPropostaSchema, type DocumentoProposta } from './schema';

const texto = (max: number) => z.string().max(max);
// A cópia de segurança aceita campos ainda incompletos, sem trim ou coerção.
// O salvamento comercial continua usando DocumentoPropostaSchema, sem alterações.
const DocumentoEmEdicao: z.ZodType<DocumentoProposta> = z.object({
  fornecedor: DocumentoPropostaSchema.shape.fornecedor,
  cliente: z.object({
    empresa: texto(160),
    contato: texto(160).nullable(),
    cargo: texto(160).nullable(),
    email: texto(320).nullable(),
  }),
  projeto: z.object({
    titulo: texto(180),
    resumo: texto(1200),
    origem: DocumentoPropostaSchema.shape.projeto.shape.origem,
  }),
  desafio: texto(4000),
  objetivo: texto(2000),
  escopo: z.array(z.object({ titulo: texto(140), descricao: texto(1200) })).max(10),
  entregaveis: z.array(texto(300)).max(12),
  cronograma: z
    .array(z.object({ fase: texto(120), duracao: texto(80), descricao: texto(600) }))
    .max(8),
  investimento: z.object({
    valorCentavos: DocumentoPropostaSchema.shape.investimento.shape.valorCentavos,
    condicoes: texto(1200),
    linkPagamento: texto(1000).nullable().optional(),
  }),
  validadeDias: z.number().int().min(0).max(90),
  proximosPassos: z.array(texto(300)).max(6),
  observacoes: texto(2000).nullable(),
});
const Registro = z.object({
  id: z.uuid(),
  dono: z.uuid(),
  base: EdicaoPropostaSchema,
  titulo: texto(180),
  documento: DocumentoEmEdicao,
  valor: texto(80),
  salvoEm: z.number().int().positive(),
});
export type RascunhoProposta = z.infer<typeof Registro>;
const PREFIXO = 'subido:proposta:rascunho:v1:';
const EPOCA = 'subido:proposta:limpeza';
const EVENTO = 'subido:proposta:rascunhos';
const PRAZO = 7 * 24 * 60 * 60 * 1000;

export function lerRascunhoProposta(raw: string | null, dono: string, agora = Date.now()) {
  if (!raw || raw.length > 160_000) return null;
  try {
    const r = Registro.parse(JSON.parse(raw));
    return r.dono === dono && r.salvoEm <= agora && agora - r.salvoEm <= PRAZO ? r : null;
  } catch {
    return null;
  }
}

export function epocaPropostas() {
  try {
    return localStorage.getItem(EPOCA) ?? '';
  } catch {
    return '';
  }
}
export function listarRascunhosProposta(dono?: string, proposta?: string) {
  if (!dono || !z.uuid().safeParse(dono).success) return [];
  try {
    return Object.keys(localStorage)
      .filter((k) => k.startsWith(`${PREFIXO}${dono}:`))
      .map((k) => lerRascunhoProposta(localStorage.getItem(k), dono))
      .filter((r): r is RascunhoProposta => r !== null && (!proposta || r.base.id === proposta))
      .sort((a, b) => b.salvoEm - a.salvoEm || a.id.localeCompare(b.id));
  } catch {
    return [];
  }
}
const chave = (r: RascunhoProposta) => `${PREFIXO}${r.dono}:${r.base.id}:${r.id}`;
const notificar = () => window.dispatchEvent(new Event(EVENTO));

export function guardarRascunhoProposta(r: RascunhoProposta, epoca: string) {
  if (epoca !== epocaPropostas()) return false;
  const raw = JSON.stringify(r);
  const validado = lerRascunhoProposta(raw, r.dono);
  if (!validado) return false;
  try {
    for (const k of Object.keys(localStorage))
      if (
        k.startsWith(`${PREFIXO}${r.dono}:`) &&
        !lerRascunhoProposta(localStorage.getItem(k), r.dono)
      )
        localStorage.removeItem(k);
    if (!localStorage.getItem(chave(r)) && listarRascunhosProposta(r.dono).length >= 30)
      return false;
    localStorage.setItem(chave(r), JSON.stringify(validado));
    notificar();
    return true;
  } catch {
    return false;
  }
}

export function removerRascunhoProposta(r: RascunhoProposta) {
  try {
    const raw = localStorage.getItem(chave(r));
    if (
      raw &&
      JSON.stringify(lerRascunhoProposta(raw, r.dono)) === JSON.stringify(Registro.parse(r))
    )
      localStorage.removeItem(chave(r));
    notificar();
    return localStorage.getItem(chave(r)) === null;
  } catch {
    return false;
  }
}

export function limparRascunhosProposta() {
  try {
    for (const k of Object.keys(localStorage))
      if (k.startsWith(PREFIXO)) localStorage.removeItem(k);
    localStorage.setItem(EPOCA, crypto.randomUUID());
  } catch {
    /* Encerrar sessão não depende do armazenamento. */
  }
  notificar();
}

export function observarRascunhosProposta(atualizar: () => void) {
  const storage = (e: StorageEvent) => {
    if (!e.key || e.key.startsWith(PREFIXO) || e.key === EPOCA) atualizar();
  };
  window.addEventListener(EVENTO, atualizar);
  window.addEventListener('storage', storage);
  return () => {
    window.removeEventListener(EVENTO, atualizar);
    window.removeEventListener('storage', storage);
  };
}
