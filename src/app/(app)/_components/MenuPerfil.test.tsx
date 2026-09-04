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
    expect(screen.getByRole('menuitem', { name: /Créditos/ })).toHaveAttribute(
      'href',
      '/conta/creditos',
    );
    expect(screen.getByRole('menuitem', { name: /Plano e cobrança/ })).toHaveAttribute(
      'href',
      '/conta/assinatura',
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

  it('mostra o saldo como créditos ao lado do perfil', () => {
    render(<MenuPerfil nome="QA Subido" email="qa@viverdeia.ai" saldoCreditos={42} />);

    const gatilho = screen.getByRole('button', { name: /42 créditos disponíveis/ });
    expect(gatilho).toHaveTextContent('42créditos');
  });

  it('permite navegar entre os destinos com setas e ir ao primeiro ou último', async () => {
    const usuario = userEvent.setup();
    render(<MenuPerfil nome="QA Subido" email="qa@viverdeia.ai" />);
    screen.getByRole('button', { name: 'QA Subido' }).focus();
    await usuario.keyboard('{ArrowDown}{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: /Créditos/ })).toHaveFocus();
    await usuario.keyboard('{End}');
    expect(screen.getByRole('menuitem', { name: 'Encerrar sessão' })).toHaveFocus();
    await usuario.keyboard('{Home}');
    expect(screen.getByRole('menuitem', { name: /Minha conta/ })).toHaveFocus();
    expect(screen.queryByText('Sincronizada')).not.toBeInTheDocument();
  });

  it('indica a central de créditos quando ela é a página atual', async () => {
    caminho = '/conta/creditos';
    const usuario = userEvent.setup();
    render(<MenuPerfil nome="QA Subido" email="qa@viverdeia.ai" saldoCreditos={42} />);

    await usuario.click(screen.getByRole('button', { name: /42 créditos disponíveis/ }));

    expect(screen.getByRole('menuitem', { name: /Créditos/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
