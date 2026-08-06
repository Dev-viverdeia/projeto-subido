import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrilhoProgresso, type ItemProgresso } from './TrilhoProgresso';

/**
 * O trilho virou peça COMPARTILHADA — ficha de solução, curso e playlist da aula
 * desenham o mesmo progresso a partir dele. É exatamente o tipo de código em que
 * um ajuste feito para uma tela quebra outra sem que ninguém perceba, porque as
 * três só aparecem juntas na navegação real.
 *
 * Os casos abaixo são os que divergem entre os consumidores: a virada de barra
 * segmentada para contínua (5 etapas contra 30 aulas), a concordância no
 * singular, e as três formas de ação (link, callback, nenhuma).
 */
const item = (n: number): ItemProgresso => ({ id: `i${n}`, titulo: `Item ${n}` });
const lista = (n: number) => Array.from({ length: n }, (_, i) => item(i + 1));

function montar(props: Partial<Parameters<typeof TrilhoProgresso>[0]> = {}) {
  const itens = props.itens ?? lista(5);
  return render(
    <TrilhoProgresso
      itens={itens}
      feitasIds={new Set()}
      proximo={itens[0] ?? null}
      unidade={{ singular: 'etapa', plural: 'etapas' }}
      {...props}
    />,
  );
}

describe('trilho de progresso', () => {
  it('não renderiza nada sem itens — barra vazia afirmaria progresso onde não há conteúdo', () => {
    const { container } = montar({ itens: [], proximo: null });
    expect(container.firstChild).toBeNull();
  });

  it('conta pelos ids, não pela posição: item fora de ordem acende a casa certa', () => {
    const itens = lista(5);
    const { container } = montar({ itens, feitasIds: new Set(['i3']) });

    const casas = [...container.querySelectorAll('li')];
    expect(casas).toHaveLength(5);
    expect((casas[0] as HTMLElement).dataset.feito).toBeUndefined();
    expect((casas[2] as HTMLElement).dataset.feito).toBe('');
    expect(screen.getByText('20')).toBeDefined();
  });

  /* Acima de 12 as casas ficariam finas demais para contar de relance — um curso
     tem dezenas de aulas, uma solução tem cinco etapas. */
  it('vira barra contínua acima de doze itens', () => {
    const { container } = montar({
      itens: lista(30),
      unidade: { singular: 'aula', plural: 'aulas' },
    });
    expect(container.querySelectorAll('li')).toHaveLength(0);
  });

  it('concorda no singular quando há um item só', () => {
    const um = lista(1);
    montar({ itens: um, feitasIds: new Set(['i1']), proximo: null });
    expect(screen.getByText(/A única etapa está marcada/)).toBeDefined();
  });

  it('a nota final só aparece no estado concluído', () => {
    const um = lista(1);
    const { rerender } = montar({
      itens: um,
      feitasIds: new Set(['i1']),
      proximo: null,
      notaFinal: 'O certificado entra depois.',
    });
    expect(screen.getByText(/O certificado entra depois/)).toBeDefined();

    rerender(
      <TrilhoProgresso
        itens={um}
        feitasIds={new Set()}
        proximo={um[0] ?? null}
        unidade={{ singular: 'etapa', plural: 'etapas' }}
        notaFinal="O certificado entra depois."
      />,
    );
    expect(screen.queryByText(/O certificado entra depois/)).toBeNull();
  });

  it('com href a ação é link; com aoContinuar é botão; sem nenhum dos dois não há ação', () => {
    const { unmount } = montar({ href: '/formacoes/x/aula/1' });
    expect(screen.getByRole('link', { name: /Começar/ })).toBeDefined();
    unmount();

    const segundo = montar({ aoContinuar: () => {} });
    expect(screen.getByRole('button', { name: /Começar/ })).toBeDefined();
    segundo.unmount();

    montar();
    expect(screen.queryByRole('link', { name: /Começar|Continuar/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Começar|Continuar/ })).toBeNull();
  });

  it('o rótulo vira "Continuar" depois da primeira marcação', () => {
    montar({ feitasIds: new Set(['i1']), href: '/x' });
    expect(screen.getByRole('link', { name: /Continuar/ })).toBeDefined();
  });

  /* A variante densa vive dentro de um painel que já é card: sem pele, sem frase
     "Próxima" (a lista logo abaixo já marca a atual) e sem botão. */
  it('a variante densa não traz frase de próxima nem ação', () => {
    montar({ denso: true, href: '/x', proximo: item(2) });
    expect(screen.queryByText(/Próxima:/)).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText(/0 de 5 etapas/)).toBeDefined();
  });
});
