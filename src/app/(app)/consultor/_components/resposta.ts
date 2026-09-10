/** Mantém a resposta legível sem aceitar HTML ou markdown vindo do modelo. */
export function blocosDaResposta(conteudo: string): string[] {
  const blocos = conteudo
    .split(/\n{2,}/)
    .map((bloco) => bloco.trim())
    .filter(Boolean);
  return blocos.length > 0 ? blocos : [conteudo.trim()];
}

/** Dobra só entre parágrafos inteiros. Não resume, corta frases ou muda a ordem. */
export function leituraDaResposta(conteudo: string) {
  const blocos = blocosDaResposta(conteudo);
  const [primeiro] = blocos;
  if (!primeiro || conteudo.length <= 1100 || blocos.length < 3 || primeiro.length > 700) {
    return { abertura: blocos, restante: [] as string[] };
  }
  return { abertura: blocos.slice(0, 1), restante: blocos.slice(1) };
}
