import guias from './guias-visuais.json';

/** Se a equipe mudar/reordenar os passos, não mostramos uma imagem com instrução divergente. */
export function capturaDoPasso(slug: string, texto: string) {
  const guia = guias.find((g) => g.slug === slug);
  const indice = guia?.passos.indexOf(texto);
  return guia?.capturas.find((c) => c.passo === indice);
}
