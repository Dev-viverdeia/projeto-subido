/** Mantém a resposta legível sem aceitar HTML ou markdown vindo do modelo. */
export function blocosDaResposta(conteudo: string): string[] {
  const blocos = conteudo
    .split(/\n{2,}/)
    .map((bloco) => bloco.trim())
    .filter(Boolean);
  return blocos.length > 0 ? blocos : [conteudo.trim()];
}
