import { expect, type Locator } from '@playwright/test';

/** Amostra a transição real sem alterar CSS ou esperar que a falha desapareça. */
export async function conferirContrasteDasEtapas(abas: Locator) {
  const amostras = await abas.evaluateAll((elementos) => {
    const rgb = (cor: string) => cor.match(/[\d.]+/g)!.map(Number);
    const luminosidade = (canais: number[]) =>
      canais.slice(0, 3).reduce((total, canal, i) => {
        const valor = canal / 255;
        return (
          total +
          (valor <= 0.04045 ? valor / 12.92 : ((valor + 0.055) / 1.055) ** 2.4) *
            [0.2126, 0.7152, 0.0722][i]!
        );
      }, 0);
    return elementos.flatMap((elemento) => {
      const animacoes = elemento.getAnimations();
      animacoes.forEach((animacao) => animacao.pause());
      const resultado = Array.from({ length: 21 }, (_, i) => {
        animacoes.forEach((animacao) => {
          animacao.currentTime = (Number(animacao.effect!.getTiming().duration) * i) / 20;
        });
        const estilo = getComputedStyle(elemento);
        const tinta = rgb(estilo.color);
        const fundo = rgb(estilo.backgroundColor);
        // A prévia usa canvas branco; a etapa inativa é transparente sobre esse canvas.
        const alfa = fundo[3] ?? 1;
        const composto = fundo.slice(0, 3).map((canal) => canal * alfa + 255 * (1 - alfa));
        const a = luminosidade(tinta);
        const b = luminosidade(composto);
        return {
          etapa: elemento.getAttribute('data-etapa'),
          fracao: i / 20,
          tinta: estilo.color,
          fundo: estilo.backgroundColor,
          contraste: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
        };
      });
      animacoes.forEach((animacao) => animacao.finish());
      return resultado;
    });
  });
  expect(amostras.filter(({ contraste }) => contraste < 4.5)).toEqual([]);
}
