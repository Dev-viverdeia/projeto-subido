import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AnchorHTMLAttributes } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ITEM_CONTA, ITENS_NAV } from './navegacao';
import { NavLateral } from './NavLateral';

let caminho = '/inicio';

vi.mock('next/navigation', () => ({
  usePathname: () => caminho,
}));

vi.mock('next/link', () => ({
  default: ({
    prefetch,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean | null }) => (
    <a data-prefetch={String(prefetch)} {...props} />
  ),
}));

afterEach(() => {
  cleanup();
  caminho = '/inicio';
  document.body.style.overflow = '';
});

describe('NavLateral no mobile', () => {
  it('mantém o dock enxuto e oferece todas as áreas no menu Mais', async () => {
    const usuario = userEvent.setup();
    render(<NavLateral itens={ITENS_NAV} itemConta={ITEM_CONTA} variante="dock" />);

    expect(screen.getByRole('link', { name: 'Início' })).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('link', { name: 'Propostas' })).not.toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Mais' }));

    expect(screen.getByRole('dialog', { name: 'Navegação' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Propostas' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Métricas' })).toHaveAttribute('href', '/metricas');
    expect(screen.getAllByRole('link', { name: 'Prospecção' })).toHaveLength(2);
    expect(screen.queryByRole('link', { name: 'Diagnósticos' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sobral AI' })).toHaveAttribute('href', '/consultor');
    expect(screen.getByRole('link', { name: 'Formações' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mentorias' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Certificados' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Minha conta/ })).toHaveAttribute('href', '/conta');
    expect(document.body).toHaveStyle({ overflow: 'hidden' });

    await usuario.click(screen.getByRole('button', { name: 'Fechar navegação' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
  });

  it('marca Mais quando a área atual não está entre os quatro atalhos', () => {
    caminho = '/propostas/nova';
    render(<NavLateral itens={ITENS_NAV} itemConta={ITEM_CONTA} variante="dock" />);

    expect(screen.getByRole('button', { name: 'Mais' })).toHaveAttribute('aria-current', 'page');
  });

  it('expõe a conta no menu mobile e mantém Mais ativo nessa rota', async () => {
    caminho = '/conta';
    const usuario = userEvent.setup();
    render(<NavLateral itens={ITENS_NAV} itemConta={ITEM_CONTA} variante="dock" />);

    expect(screen.getByRole('button', { name: 'Mais' })).toHaveAttribute('aria-current', 'page');
    await usuario.click(screen.getByRole('button', { name: 'Mais' }));

    expect(screen.getByRole('link', { name: /Minha conta/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByText('Você está aqui')).toBeInTheDocument();
  });
});

describe('NavLateral no desktop', () => {
  it('explica os itens do Pro sem esconder as áreas disponíveis no Starter', () => {
    const itensStarter = ITENS_NAV.map((item) => ({
      ...item,
      bloqueado: ['/prospeccao', '/vendas', '/metricas', '/propostas'].includes(item.href),
      destinoBloqueado: `/conta/assinatura?upgrade=vendas&origem=${encodeURIComponent(item.href)}`,
      planoNecessario: 'Pro',
    }));
    render(<NavLateral itens={itensStarter} variante="lateral" />);

    expect(screen.getByRole('link', { name: 'Vendas, disponível no Pro' })).toHaveAttribute(
      'href',
      '/conta/assinatura?upgrade=vendas&origem=%2Fvendas',
    );
    expect(screen.getByRole('link', { name: 'Reuniões' })).toHaveAttribute('href', '/reunioes');
    expect(screen.getAllByText('Pro')).toHaveLength(4);
  });

  it('só prepara a rota completa depois que a pessoa demonstra intenção', async () => {
    const usuario = userEvent.setup();
    render(<NavLateral itens={ITENS_NAV} variante="lateral" />);

    const vendas = screen.getByRole('link', { name: 'Vendas' });
    expect(vendas).toHaveAttribute('data-prefetch', 'false');
    expect(screen.getByRole('link', { name: 'Métricas' })).toHaveAttribute(
      'data-prefetch',
      'false',
    );
    expect(screen.getByRole('link', { name: 'Sobral AI' })).toHaveAttribute('href', '/consultor');

    await usuario.hover(vendas);
    expect(vendas).toHaveAttribute('data-prefetch', 'true');
  });

  it('indica a navegação no próprio item sem cobrir a página', async () => {
    const usuario = userEvent.setup();
    render(<NavLateral itens={ITENS_NAV} variante="lateral" />);

    const vendas = screen.getByRole('link', { name: 'Vendas' });
    await usuario.click(vendas);

    expect(vendas).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
