/**
 * Iniciais de uma ferramenta a partir do NOME — derivação, não invenção.
 *
 * O banco guarda só o título do item (`solucao_itens.titulo`): não há logo, url
 * nem sigla. Reduzir "WhatsApp Business API" a "WB" — as iniciais das duas
 * primeiras palavras — não afirma nada que o dado já não diga; é o mesmo fallback
 * que o `Avatar` do DS faz com um nome de pessoa. O que seria invenção é desenhar
 * o LOGOTIPO da ferramenta, ou escrever "WA" como se a marca tivesse uma sigla
 * própria: a função não sabe disso, e o comentário não pode fingir que sabe.
 * Por isso o nome completo continua ao lado, no card e na ficha.
 *
 * Vive num arquivo próprio porque o catálogo e a ficha usam a MESMA sigla para a
 * mesma ferramenta. Duas implementações divergiriam em "n8n" na primeira vez que
 * alguém ajustasse o separador.
 */
export function iniciais(nome: string): string {
  const palavras = nome.split(/[\s.-]+/).filter(Boolean);
  if (palavras.length === 0) return '?';
  if (palavras.length === 1) return palavras[0]!.slice(0, 2).toUpperCase();
  return (palavras[0]![0]! + palavras[1]![0]!).toUpperCase();
}
