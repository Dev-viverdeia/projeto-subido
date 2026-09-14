export type TrechoMensagem = { texto: string; href?: string };

/** Texto de participantes não é HTML nem Markdown. Só URLs explícitas viram links. */
export function separarLinksMensagem(mensagem: string): TrechoMensagem[] {
  const trechos: TrechoMensagem[] = [];
  let inicio = 0;
  for (const match of mensagem.matchAll(/https?:\/\/[^\s<>"'`“”‘’]+/giu)) {
    const indice = match.index;
    // Não transformar parte de outro protocolo em um destino clicável.
    if (indice > 0 && !/[\s([<{"'“‘]/u.test(mensagem.charAt(indice - 1))) continue;
    let texto = match[0].replace(/[.,!?:;]+$/u, '');
    for (const [abre, fecha] of [
      ['(', ')'],
      ['[', ']'],
      ['{', '}'],
    ] as const) {
      const excesso = texto.split(fecha).length - texto.split(abre).length;
      for (let i = 0; i < excesso && texto.endsWith(fecha); i += 1) texto = texto.slice(0, -1);
    }
    texto = texto.replace(/[.,!?:;]+$/u, '');
    // Controles invisíveis, bidi e barras invertidas podem disfarçar o destino exibido.
    if (/[\p{Cc}\p{Cf}\\]/u.test(texto)) continue;
    const autoridade = /^https?:\/\/([^/?#]+)/iu.exec(texto)?.[1];
    if (!autoridade || autoridade.includes('@')) continue;
    try {
      const url = new URL(texto);
      if (
        !['http:', 'https:'].includes(url.protocol) ||
        !url.hostname ||
        url.username ||
        url.password
      )
        continue;
      if (indice > inicio) trechos.push({ texto: mensagem.slice(inicio, indice) });
      trechos.push({ texto, href: url.href });
      inicio = indice + texto.length;
    } catch {
      // Endereço inválido continua legível como texto, sem impedir o restante da conversa.
    }
  }
  if (inicio < mensagem.length) trechos.push({ texto: mensagem.slice(inicio) });
  return trechos;
}
