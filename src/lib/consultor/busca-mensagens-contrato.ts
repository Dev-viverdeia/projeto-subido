import { z } from 'zod';

export const TAMANHO_PAGINA_MENSAGENS = 20;
export const BuscaMensagensSchema = z.object({
  conversa: z.uuid(),
  dono: z.uuid(),
  busca: z.string().trim().min(2).max(120),
  pagina: z.coerce.number().int().min(0).max(10000).default(0),
});
export type MensagemEncontrada = {
  id: string;
  papel: 'usuario' | 'consultor';
  trecho: string;
  criadoEm: string;
};
export type PaginaBuscaMensagens = {
  mensagens: MensagemEncontrada[];
  total: number;
  mais: boolean;
};

/** Uma janela ao redor da primeira ocorrência, sem interpretar HTML ou markdown. */
export function trechoDaMensagem(texto: string, busca: string) {
  const posicao = texto.toLowerCase().indexOf(busca.toLowerCase());
  let inicio = Math.max(0, posicao - 65);
  while (inicio > 0 && inicio < posicao && !/\s/.test(texto[inicio - 1] ?? '')) inicio++;
  const fim = Math.min(texto.length, Math.max(0, posicao) + busca.length + 135);
  return `${inicio > 0 ? '…' : ''}${texto.slice(inicio, fim).trim().replace(/\s+/g, ' ')}${fim < texto.length ? '…' : ''}`;
}
