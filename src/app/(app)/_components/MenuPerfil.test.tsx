import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MenuPerfil } from './MenuPerfil';

let caminho = '/conta';

vi.mock('next/navigation', () => ({
  usePathname: () => caminho,
}));

vi.mock('@/lib/auth/actions', () => ({
  sair: vi.fn(),
}));

afterEach(() => {
  cleanup();
  caminho = '/conta';
});

describe('MenuPerfil', () => {
  it('reúne identidade, continuidade e saída segura', async () => {
    const usuario = userEvent.setup();
    render(<MenuPerfil nome="QA Subido" email="qa@viverdeia.ai" />);

    await usuario.click(screen.getByRole('button', { name: 'QA Subido' }));

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Minha conta/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('menuitem', { name: /Certificados/ })).toHaveAttribute(
      'href',
      '/certificados',
    );
    expect(screen.getByRole('menuitem', { name: 'Encerrar sessão' })).toHaveAttribute(
      'type',
      'submit',
    );
  });

  it('fecha com Escape e devolve o foco ao gatilho', async () => {
    const usuario = userEvent.setup();
    render(<MenuPerfil nome="QA Subido" email="qa@viverdeia.ai" />);
    const gatilho = screen.getByRole('button', { name: 'QA Subido' });

    await usuario.click(gatilho);
    await usuario.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(gatilho).toHaveFocus();
  });

  it('abre com seta para baixo e foca o primeiro destino', async () => {
    const usuario = userEvent.setup();
    render(<MenuPerfil nome="QA Subido" email="qa@viverdeia.ai" />);
    const gatilho = screen.getByRole('button', { name: 'QA Subido' });

    gatilho.focus();
    await usuario.keyboard('{ArrowDown}');

    expect(screen.getByRole('menuitem', { name: /Minha conta/ })).toHaveFocus();
  });
});
