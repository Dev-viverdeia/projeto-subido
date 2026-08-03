import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { AbasFiltro } from './AbasFiltro';
import { ControleSegmentado } from './ControleSegmentado';

/**
 * `role="tablist"` é uma PROMESSA: quem usa leitor de tela ouve "guia 2 de 3" e
 * tenta as setas, porque é assim que toda tablist funciona no padrão ARIA. Os
 * dois controles da régua declaram esse papel e vivem lado a lado — o
 * `ControleSegmentado` passou meses sem cumprir o contrato que anunciava.
 *
 * O teste roda contra OS DOIS de propósito: o hook existe justamente para que
 * eles não voltem a divergir, e um teste que só cobrisse um não perceberia.
 */
const OPCOES = [
  { id: 'a', rotulo: 'Todas' },
  { id: 'b', rotulo: 'Em andamento' },
  { id: 'c', rotulo: 'Concluídas' },
];

function Abas() {
  const [ativa, setAtiva] = useState('a');
  return (
    <AbasFiltro
      abas={OPCOES}
      ativa={ativa}
      aoMudar={setAtiva}
      layoutId="teste-abas"
      ariaLabel="Situação"
    />
  );
}

function Segmentado() {
  const [ativa, setAtiva] = useState('a');
  return (
    <ControleSegmentado
      opcoes={OPCOES}
      ativa={ativa}
      aoMudar={setAtiva}
      layoutId="teste-segmentado"
      ariaLabel="Situação"
    />
  );
}

beforeEach(() => {
  /* `motion` consulta `matchMedia` pelo `useReducedMotion`. */
  if (!('matchMedia' in window)) {
    Reflect.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
      writable: true,
    });
  }
});

describe.each([
  ['abas tipográficas', Abas],
  ['controle segmentado', Segmentado],
])('%s', (_nome, Componente) => {
  it('a seta direita anda e circula na última', async () => {
    const user = userEvent.setup();
    render(<Componente />);

    await user.tab();
    expect(screen.getByRole('tab', { name: /Todas/ })).toHaveProperty('tabIndex', 0);

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: /Em andamento/ }).getAttribute('aria-selected')).toBe(
      'true',
    );

    await user.keyboard('{ArrowRight}{ArrowRight}');
    /* Da última volta para a primeira, como manda o padrão. */
    expect(screen.getByRole('tab', { name: /Todas/ }).getAttribute('aria-selected')).toBe('true');
  });

  it('Home e End vão às pontas', async () => {
    const user = userEvent.setup();
    render(<Componente />);

    await user.tab();
    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: /Concluídas/ }).getAttribute('aria-selected')).toBe(
      'true',
    );

    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: /Todas/ }).getAttribute('aria-selected')).toBe('true');
  });

  /* Sem o tabindex rotativo, três opções viram TRÊS paradas de Tab antes de a
     pessoa chegar ao próximo controle da régua. */
  it('o trilho inteiro é uma parada de Tab só', async () => {
    const user = userEvent.setup();
    render(<Componente />);

    await user.tab();
    const ativo = screen.getByRole('tab', { name: /Todas/ });
    expect(document.activeElement).toBe(ativo);

    const inativas = screen.getAllByRole('tab').filter((t) => t !== ativo);
    for (const t of inativas) expect(t).toHaveProperty('tabIndex', -1);
  });

  it('o foco acompanha a seleção — a seta seguinte parte de onde parou', async () => {
    const user = userEvent.setup();
    render(<Componente />);

    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: /Em andamento/ }));
  });
});
