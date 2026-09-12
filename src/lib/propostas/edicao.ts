import { z } from 'zod';
import { DocumentoPropostaSchema, formatarReais, type DocumentoProposta } from './schema';

export const EdicaoPropostaSchema = z.object({
  id: z.uuid(),
  titulo: z.string().min(1).max(180),
  documento: DocumentoPropostaSchema,
  versao: z.number().int().positive(),
  status: z.enum(['rascunho', 'pronta', 'apresentada', 'aceita', 'recusada']),
});
export type EdicaoProposta = z.infer<typeof EdicaoPropostaSchema>;
export type ConteudoEdicao = Pick<EdicaoProposta, 'titulo' | 'documento'>;

export function mesmoConteudo(a: ConteudoEdicao, b: ConteudoEdicao) {
  const assinatura = (item: ConteudoEdicao) => {
    const documento = DocumentoPropostaSchema.safeParse(item.documento);
    return JSON.stringify([
      item.titulo.trim(),
      documento.success ? documento.data : item.documento,
    ]);
  };
  return assinatura(a) === assinatura(b);
}

function trechos({ titulo, documento: d }: ConteudoEdicao) {
  const linhas = (valores: (string | null | undefined)[]) => valores.filter(Boolean).join('\n');
  const itens = (valores: string[]) => valores.map((valor) => `• ${valor}`).join('\n');
  const fornecedor = d.fornecedor;
  const origem: Record<DocumentoProposta['projeto']['origem'], string> = {
    catalogo: 'Projeto da biblioteca',
    estudio: 'Projeto do Estúdio',
    sem_base: 'Projeto personalizado',
  };
  return {
    'Nome da proposta': titulo,
    Cliente: linhas(Object.values(d.cliente)),
    Responsável: fornecedor ? linhas(Object.values(fornecedor)) : '',
    Projeto: linhas([d.projeto.titulo, d.projeto.resumo, origem[d.projeto.origem]]),
    Desafio: d.desafio,
    Objetivo: d.objetivo,
    Escopo: itens(d.escopo.map((item) => `${item.titulo}\n${item.descricao}`)),
    Entregáveis: itens(d.entregaveis),
    Cronograma: itens(
      d.cronograma.map((item) => `${item.fase} · ${item.duracao}\n${item.descricao}`),
    ),
    'Valor e condições': linhas([
      formatarReais(d.investimento.valorCentavos),
      d.investimento.condicoes,
      d.investimento.linkPagamento,
      `Validade: ${d.validadeDias} dias`,
    ]),
    'Próximos passos': itens(d.proximosPassos),
    Observações: d.observacoes ?? '',
  };
}

export function compararEdicoes(local: ConteudoEdicao, salva: ConteudoEdicao) {
  const a = trechos(local);
  const b = trechos(salva);
  return (Object.keys(a) as (keyof typeof a)[])
    .filter((rotulo) => a[rotulo] !== b[rotulo])
    .map((rotulo) => ({ rotulo, local: a[rotulo], salva: b[rotulo] }));
}
