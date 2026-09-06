import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/billing/actions', () => ({ comprarPacoteCreditos: async () => {} }));
import { PainelCreditos } from './PainelCreditos';
const catalogo = {
  pronto: true,
  planos: { starter: 'R$ 99,00', pro: null },
  pacotes: { essencial: null, crescimento: null, escala: null },
};
afterEach(cleanup);
it('um catálogo só de assinaturas não cria uma seção de pacotes vazia', () => {
  render(
    <PainelCreditos
      plano="starter"
      catalogo={catalogo}
      carteira={{ saldo: 30, movimentos: [], extratoDisponivel: true }}
    />,
  );
  expect(screen.getByText('Compra de créditos indisponível por enquanto.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Comprar/ })).not.toBeInTheDocument();
});
it('falha de extrato e saldo têm recuperação, não são ausência de movimentação ou saldo zero', () => {
  render(
    <PainelCreditos
      plano="pro"
      catalogo={catalogo}
      carteira={{ saldo: null, movimentos: [], extratoDisponivel: false }}
    />,
  );
  expect(screen.getByText('Não conseguimos carregar o extrato.')).toBeInTheDocument();
  expect(screen.getByText('Saldo indisponível no momento.')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Tentar novamente/ })).toHaveAttribute(
    'href',
    '/conta/creditos',
  );
  expect(screen.queryByText('Nenhuma movimentação por aqui ainda.')).not.toBeInTheDocument();
});
