import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

    expect(screen.getByRole('dialog', { name: 'A ficha não foi atualizada.' })).toBeVisible();
    expect(screen.getAllByText(/3 créditos foram devolvidos/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Voltar para a ficha' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível atualizar a ficha.');
  });

  it('abre o progresso acima da ficha e permite continuar trabalhando', () => {
    render(<EstadoEnriquecimento status="processando" erro={null} />);

    expect(screen.getByRole('dialog', { name: 'Atualizando a ficha do cliente' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar usando a ficha' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver andamento' })).toBeVisible();
  });

  afterEach(() => vi.useRealTimers());

  it('não inventa etapas concluídas pelo tempo e não abandona a consulta após 4 minutos', () => {
    vi.useFakeTimers();
    render(<EstadoEnriquecimento status="processando" etapa="ler_contexto" erro={null} />);
    for (let i = 0; i < 90; i++)
      act(() => {
        vi.advanceTimersByTime(15000);
      });
    expect(document.querySelector('[data-estado="concluida"]')).toBeNull();
    expect(refresh.mock.calls.length).toBeGreaterThan(60);
  });

  it('mostra somente o progresso confirmado e permite sair por teclado', () => {
    render(<EstadoEnriquecimento status="processando" etapa="ler_site" erro={null} />);
    expect(document.querySelectorAll('[data-estado="concluida"]')).toHaveLength(1);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab' });
    expect(screen.getByRole('button', { name: 'Continuar usando a ficha' })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
