import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/billing/actions', () => ({
  iniciarAssinatura: async () => {},
  abrirPortalCobranca: async () => {},
}));
import { PainelAssinatura } from './PainelAssinatura';
const catalogo = {
  pronto: false,
  planos: { starter: null, pro: null },
  pacotes: { essencial: null, crescimento: null, escala: null },
};
const base = {
  plano: 'pro' as const,
  saldo: 30,
  catalogo,
  creditos: { starter: null, pro: null },
  indisponivel: false,
  assinatura: null,
};
afterEach(cleanup);
it('acesso Starter sem recorrência não impede assinar o próprio Starter', () => {
  render(
    <PainelAssinatura
      {...base}
      plano="starter"
      catalogo={{ ...catalogo, pronto: true, planos: { starter: 'R$ 99,00', pro: null } }}
    />,
  );
  expect(screen.getByRole('button', { name: 'Escolher Starter' })).toBeInTheDocument();
});
it('pagamento pendente tem destaque e ação de regularização, nunca tudo em dia', () => {
  render(
    <PainelAssinatura
      {...base}
      assinatura={{
        status: 'past_due',
        cancela_ao_fim_do_periodo: false,
        periodo_atual_termina_em: '2026-10-05T12:00:00Z',
      }}
    />,
  );
  expect(screen.getByText('Pagamento pendente')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Regularizar pagamento' })).toBeInTheDocument();
  expect(screen.queryByText(/Tudo em dia|Próxima renovação/i)).not.toBeInTheDocument();
});
it('assinatura cancelada não promete renovação nem acesso futuro', () => {
  render(
    <PainelAssinatura
      {...base}
      assinatura={{
        status: 'canceled',
        cancela_ao_fim_do_periodo: true,
        periodo_atual_termina_em: '2026-08-05T12:00:00Z',
      }}
    />,
  );
  expect(screen.getByText('Assinatura encerrada')).toBeInTheDocument();
  expect(screen.queryByText(/Acesso até|Renovação em/i)).not.toBeInTheDocument();
});
it('não mostra ausência de assinatura ou plano novo comprável quando a consulta falha', () => {
  render(<PainelAssinatura {...base} indisponivel />);
  expect(screen.getByText('Não conseguimos consultar sua assinatura.')).toBeInTheDocument();
  expect(screen.queryByText('Sem assinatura recorrente')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Escolher/ })).not.toBeInTheDocument();
});
it('catálogo não configurado não inventa preços ou franquia mensal', () => {
  render(<PainelAssinatura {...base} />);
  expect(screen.getByText('Novas assinaturas indisponíveis por enquanto.')).toBeInTheDocument();
  expect(screen.queryByText(/30 créditos.*ciclo|100 créditos.*ciclo/)).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Escolher/ })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Ver extrato/ })).toHaveAttribute(
    'href',
    '/conta/creditos',
  );
});
