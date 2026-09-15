/** Detecta combinações que o CSS aceita como texto, mas o navegador descarta. */
export function validarMovimento(css) {
  // Preserva posições e linhas sem interpretar exemplos dentro de comentários.
  const codigo = css.replace(/\/\*[\s\S]*?\*\//g, (trecho) => trecho.replace(/[^\n]/g, ' '));
  const achados = [];
  const tokenComposto = /var\(\s*--app-t-(?:state|touch|reveal|scene)\s*\)/;
  const curva =
    /(?:^|\s)(?:ease(?:-in-out|-in|-out)?|linear|step-start|step-end)(?=\s|$)|(?:cubic-bezier|steps)\s*\(|var\(\s*--(?:via|app)-ease-/;

  for (const declaracao of codigo.matchAll(
    /\b((?:animation|transition)(?:-duration|-delay)?)\s*:\s*([^;{}]+);/g,
  )) {
    const [, propriedade, valor] = declaracao;
    let profundidade = 0;
    let parte = '';
    const itens = [];
    for (const caractere of valor) {
      if (caractere === '(') profundidade += 1;
      if (caractere === ')') profundidade -= 1;
      if (caractere === ',' && profundidade === 0) {
        itens.push(parte);
        parte = '';
      } else parte += caractere;
    }
    itens.push(parte);

    for (const item of itens) {
      if (!tokenComposto.test(item)) continue;
      const motivo =
        propriedade.endsWith('-duration') || propriedade.endsWith('-delay')
          ? 'Tempo recebeu um token que também contém curva'
          : curva.test(item.replace(tokenComposto, ''))
            ? 'Duas curvas na mesma transição'
            : null;
      if (motivo)
        achados.push({
          linha: codigo.slice(0, declaracao.index).split('\n').length,
          trecho: `${propriedade}: ${item.trim()}`,
          motivo,
        });
    }
  }
  return achados;
}
