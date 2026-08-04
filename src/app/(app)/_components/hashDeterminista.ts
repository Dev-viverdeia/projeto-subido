/**
 * Hash de 32 bits estável a partir de uma string — FNV-1a com a avalanche do
 * murmur3 no fim.
 *
 * POR QUE ELE EXISTE COMO ARQUIVO. O pôster sintético das formações já o tinha
 * embutido, e o retrato dos mentores precisa exatamente do mesmo comportamento.
 * Duas cópias de uma função de hash é pior que duas cópias de um componente: elas
 * podem divergir num bit e ninguém percebe, porque as duas continuam "gerando
 * algo bonito" — só que a mesma entrada passa a dar saídas diferentes em telas
 * diferentes, e a identidade visual do objeto deixa de ser estável.
 *
 * DERIVADO DA IDENTIDADE, NUNCA DO ÍNDICE. É isto que faz o mesmo mentor ter
 * sempre o mesmo retrato, esteja ele em primeiro ou em último depois de um
 * filtro. Índice na lista mudaria o desenho a cada reordenação.
 *
 * SOBRE A AVALANCHE, COM O NÚMERO MEDIDO — porque a versão anterior deste
 * comentário afirmava o que não tinha conferido.
 *
 * A justificativa herdada dizia que sem ela os bits baixos ficam presos às
 * últimas letras e nomes de uma mesma família saem quase iguais. Medido nos
 * quatro nomes reais do produto ("Equipe Subido · Tráfego/Produto/Comercial/
 * Implementação"), a menor separação máxima entre pares foi:
 *
 *   sem avalanche → 29,8 pontos percentuais
 *   com avalanche → 27,8 pontos percentuais
 *
 * Ou seja: para ESTAS entradas ela não ajuda, e é marginalmente pior. Fica no
 * código como higiene geral de hash — FNV-1a tem bits baixos fracos para classes
 * de entrada que ainda não usamos (slugs curtos, sufixos numéricos) —, e não
 * porque resolva o caso que o comentário antigo descrevia.
 *
 * O que o teste prende NÃO é a avalanche, é a propriedade que importa de fato:
 * campos VISIVELMENTE distintos entre nomes parecidos.
 */
export function hashDeterminista(entrada: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < entrada.length; i += 1) {
    h ^= entrada.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b);
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * Uma fatia de 8 bits do hash, normalizada em 0–1.
 *
 * É o que permite derivar VÁRIOS valores contínuos independentes de um hash só —
 * posição x, posição y, ângulo — em vez de sortear entre N variantes fixas. Com
 * 4 variantes sorteadas, a chance de quatro cards vizinhos saírem todos
 * diferentes é 4!/4⁴ ≈ 9%; medido na tela das formações, deram 2 campos distintos
 * em 4 e a variação simplesmente não acontecia. Interpolando não há colisão.
 */
export function fatia(hash: number, deslocamento: number): number {
  return ((hash >>> deslocamento) & 0xff) / 255;
}
