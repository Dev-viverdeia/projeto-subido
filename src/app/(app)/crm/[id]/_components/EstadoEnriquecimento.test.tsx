import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

import { EstadoEnriquecimento } from './EstadoEnriquecimento';

describe('EstadoEnriquecimento', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = '';
  });

  it('mostra a falha imediatamente em uma janela destacada', () => {
    render(
      <EstadoEnriquecimento
        status="falhou"
        erro="A fonte principal não respondeu."
        acao={<button type="button">Tentar novamente</button>}
      />,
    );

    expect(screen.getByRole('alertdialog', { name: 'A ficha não foi atualizada.' })).toBeVisible();
    expect(screen.getByText(/saldo já recebeu de volta os 3 créditos/i)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Voltar para a ficha' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(
      screen.getByRole('alert', { name: 'Não foi possível atualizar a ficha.' }),
    ).toBeVisible();
  });

  it('abre o progresso acima da ficha e permite continuar trabalhando', () => {
    render(<EstadoEnriquecimento status="processando" erro={null} />);

    expect(screen.getByRole('dialog', { name: 'Atualizando a ficha do cliente' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar usando a ficha' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver andamento' })).toBeVisible();
  });
});
