import { z } from 'zod';

const data = z.iso.datetime({ offset: true }).nullable();

/** Metadados de leitura: nunca transporta nem substitui o conteúdo do editor. */
export const AcompanhamentoPropostaSchema = z.object({
  id: z.uuid(),
  status: z.enum(['rascunho', 'pronta', 'apresentada', 'aceita', 'recusada']),
  versao: z.number().int().positive(),
  execucaoId: z.uuid().nullable(),
  compartilhamento: z.object({
    codigo: z.uuid().nullable(),
    ativo: z.boolean(),
    compartilhadaEm: data,
    primeiraVisualizacaoEm: data,
    ultimaVisualizacaoEm: data,
    visualizacoes: z.number().int().nonnegative(),
    decisaoNome: z.string().nullable(),
    decisaoEmail: z.string().nullable(),
    decisaoComentario: z.string().nullable(),
    decididaEm: data,
  }),
});

export type AcompanhamentoProposta = z.infer<typeof AcompanhamentoPropostaSchema>;

export function avisoDeAtualizacao(
  anterior: AcompanhamentoProposta,
  atual: AcompanhamentoProposta,
): string | null {
  if (atual.status !== anterior.status) {
    if (atual.status === 'aceita') return 'A proposta foi aceita.';
    if (atual.status === 'recusada') return 'A proposta não foi aprovada.';
    return 'O status da proposta foi atualizado.';
  }
  if (atual.compartilhamento.codigo !== anterior.compartilhamento.codigo) {
    return 'O link da proposta foi atualizado.';
  }
  if (anterior.compartilhamento.ativo && !atual.compartilhamento.ativo) {
    return 'O link da proposta foi desativado.';
  }
  return null;
}
