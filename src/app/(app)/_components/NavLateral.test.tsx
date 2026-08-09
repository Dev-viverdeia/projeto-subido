import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ITENS_NAV } from './navegacao';
import { NavLateral } from './NavLateral';

let caminho = '/inicio';

vi.mock('next/navigation', () => ({
  usePathname: () => caminho,
}));

afterEach(() => {
  cleanup();
  caminho = '/inicio';
  document.body.style.overflow = '';
});

describe('NavLateral no mobile', () => {
  it('mantém o dock enxuto e oferece todas as áreas no menu Mais', async () => {
    const usuario = userEvent.setup();
    render(<NavLateral itens={ITENS_NAV} variante="dock" />);

    expect(screen.getByRole('link', { name: 'Início' })).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('link', { name: 'Propostas' })).not.toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Mais' }));

    expect(screen.getByRole('dialog', { name: 'Navegação' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Propostas' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Diagnósticos' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sobral AI' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Formações' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mentorias' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Certificados' })).toBeInTheDocument();
    expect(document.body).toHaveStyle({ overflow: 'hidden' });

    await usuario.click(screen.getByRole('button', { name: 'Fechar navegação' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
  });

  it('marca Mais quando a área atual não está entre os quatro atalhos', () => {
    caminho = '/propostas/nova';
    render(<NavLateral itens={ITENS_NAV} variante="dock" />);

    expect(screen.getByRole('button', { name: 'Mais' })).toHaveAttribute('aria-current', 'page');
  });
});
