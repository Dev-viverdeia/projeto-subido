import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/projetos-execucao/evolucao-actions', () => ({
  iniciarContinuidadeComercial: vi.fn(),
}));

import { ContinuidadeComercial } from './ContinuidadeComercial';

const BASE = {
  projetoId: '11111111-1111-4111-8111-111111111111',
  empresa: 'Clínica Aurora',
  decisao: 'expandir' as const,
  proximoPasso: 'Validar o segundo canal com a responsável.',
  proximoPassoEm: '2026-09-15',
};

describe('ContinuidadeComercial', () => {
  it('confirma o efeito antes de criar uma oportunidade', async () => {
    const usuario = userEvent.setup();
    render(<ContinuidadeComercial {...BASE} oportunidadeId={null} />);

    await usuario.click(screen.getByRole('button', { name: /Criar oportunidade/i }));

    const dialogo = screen.getByRole('dialog');
    expect(dialogo).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Criar uma nova venda?' })).toBeVisible();
    expect(screen.getByText('Clínica Aurora')).toBeVisible();
    expect(screen.getByText('Expandir este projeto')).toBeVisible();
    expect(screen.getByText(/Esta entrega continua concluída/i)).toBeVisible();
    expect(dialogo).toHaveAccessibleDescription('Os dados desta entrega já serão aproveitados.');
    expect(screen.getAllByRole('button', { name: 'Criar oportunidade' }).at(-1)).toBeVisible();
  });

  it('abre a oportunidade existente sem oferecer outra criação', () => {
    render(
      <ContinuidadeComercial {...BASE} oportunidadeId="22222222-2222-4222-8222-222222222222" />,
    );

    expect(screen.getByRole('link', { name: /Abrir em Vendas/i })).toHaveAttribute(
      'href',
      '/vendas/22222222-2222-4222-8222-222222222222?origem=pos-entrega',
    );
    expect(screen.queryByRole('button', { name: /Criar oportunidade/i })).not.toBeInTheDocument();
  });
});
