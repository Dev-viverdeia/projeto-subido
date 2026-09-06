/** O schema mantém resposta como primeira propriedade. Só esse texto pode ir ao
 * navegador; nunca JSON parcial, diagnóstico interno ou recomendações não validadas. */
export function textoProgressivo(json: string): string {
  const inicio = /^\s*\{\s*"resposta"\s*:\s*"/.exec(json);
  if (!inicio) return '';
  let codificado = '';
  for (let i = inicio[0].length; i < json.length; i++) {
    const c = json[i]!;
    if (c === '"') break;
    if (c === '\\') {
      const proximo = json[i + 1];
      if (!proximo) break;
      const tamanho = proximo === 'u' ? 6 : 2;
      if (i + tamanho > json.length) break;
      codificado += json.slice(i, i + tamanho);
      i += tamanho - 1;
    } else codificado += c;
  }
  try {
    const texto = JSON.parse(`"${codificado}"`) as string;
    return texto.replace(/[\uD800-\uDBFF]$/, '').slice(0, 3000);
  } catch {
    return '';
  }
}
