function normalizar(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** Evita repetir na capa um título interno que só replica o nome do Projeto. */
export function subtituloVisivel(titulo: string, projeto: string): string | null {
  const tituloNormalizado = normalizar(titulo).replace(/^proposta\s*[·:-]\s*/, '');
  return tituloNormalizado === normalizar(projeto) ? null : titulo.trim();
}
