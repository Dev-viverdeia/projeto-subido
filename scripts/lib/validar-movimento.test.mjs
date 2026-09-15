import { describe, expect, it } from 'vitest';
import { validarMovimento } from './validar-movimento.mjs';

describe('contrato dos tokens de movimento', () => {
  it.each(['animation-duration', 'transition-duration', 'animation-delay', 'transition-delay'])(
    'recusa o token composto em %s',
    (propriedade) => {
      expect(validarMovimento(`.modal { ${propriedade}: var(--app-t-reveal); }`)).toHaveLength(1);
    },
  );
  it.each(['ease-out', 'cubic-bezier(.16, 1, .3, 1)', 'var(--via-ease-snap)'])(
    'recusa uma segunda curva: %s',
    (curva) => {
      expect(
        validarMovimento(`.menu { animation: abrir var(--app-t-state) ${curva} backwards; }`),
      ).toHaveLength(1);
    },
  );
  it('aceita tempo puro, shorthand e listas com curvas independentes', () => {
    expect(
      validarMovimento(`
      .menu { animation: abrir var(--app-t-reveal) backwards; }
      .modal { animation-duration: var(--app-motion-reveal); }
      .botao { transition: transform var(--app-t-touch), opacity 0s linear; }
      .icone { animation: ease-fade var(--app-t-state) backwards; }
    `),
    ).toEqual([]);
  });
  it('detecta a segunda curva mesmo antes do nome da animação', () => {
    expect(
      validarMovimento('.menu { animation: ease-out abrir var(--app-t-state); }'),
    ).toHaveLength(1);
  });
  it('ignora comentários e informa a linha de declarações multilinha', () => {
    expect(
      validarMovimento(`/* animation-duration: var(--app-t-state); */
.menu {
  animation:
    abrir var(--app-t-reveal) ease-out;
}`),
    ).toMatchObject([{ linha: 3 }]);
  });
});
