import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { NavAula as TipoNavAula } from './NavAula';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

type Props = Parameters<typeof TipoNavAula>[0];
let NavAula: (props: Props) => React.ReactNode;

beforeEach(async () => {
  localStorage.clear();
  push.mockReset();
  vi.resetModules();
  NavAula = (await import('./NavAula')).NavAula;
});

const props: Props = {
  formacaoSlug: 'formacao-lovable',
  aulaId: 'a2',
  anteriorId: 'a1',
  anteriorTitulo: 'Primeiros passos',
  proximaId: 'a3',
  proximaTitulo: 'Publicando o projeto',
};

describe('Navegação da aula', () => {
  it('expõe as aulas vizinhas como links com título e destino reais', () => {
    render(<NavAula {...props} />);

    expect(screen.getByRole('link', { name: 'Aula anterior: Primeiros passos' })).toHaveAttribute(
      'href',
      '/formacoes/formacao-lovable/aula/a1',
    );
    expect(
      screen.getByRole('link', { name: 'Próxima aula: Publicando o projeto' }),
    ).toHaveAttribute('href', '/formacoes/formacao-lovable/aula/a3');
  });

  it('conclui e avança com uma ação explícita', async () => {
    const user = userEvent.setup();
    render(<NavAula {...props} />);

    await user.click(screen.getByRole('button', { name: 'Concluir e avançar' }));
    expect(push).toHaveBeenCalledWith('/formacoes/formacao-lovable/aula/a3');
  });

  it('na última aula deixa claro que a formação será concluída', () => {
    render(<NavAula {...props} proximaId={null} proximaTitulo={null} />);
    expect(screen.getByRole('button', { name: 'Concluir formação' })).toBeDefined();
  });
});
