import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { conferirEnriquecimento } from '@/lib/crm/invocar-enriquecimento';
import { RecuperarEnriquecimento } from './RecuperarEnriquecimento';

vi.mock('@/lib/crm/invocar-enriquecimento', () => ({ conferirEnriquecimento: vi.fn() }));
const abrir = vi.fn();
const anterior = '11111111-1111-4111-8111-111111111111';
const novo = '22222222-2222-4222-8222-222222222222';
beforeEach(() => vi.clearAllMocks());
function montar(anteriorId: string | null | undefined = anterior) {
  render(
    <RecuperarEnriquecimento oportunidadeId="ficha" anteriorId={anteriorId} aoAbrirFicha={abrir} />,
  );
}
describe('conferir análise sem repetir o pedido', () => {
  it.each([null, { id: anterior, status: 'concluido' as const }])(
    'não confunde ausência ou resultado anterior com sucesso: %j',
    async (recibo) => {
      vi.mocked(conferirEnriquecimento).mockResolvedValue(recibo);
      montar();
      fireEvent.click(screen.getByRole('button', { name: 'Conferir andamento' }));
      expect(await screen.findByText(/Ainda não encontramos/)).toBeVisible();
      expect(screen.queryByText('Ver resultado')).toBeNull();
      expect(abrir).not.toHaveBeenCalled();
    },
  );
  it.each(['processando', 'concluido', 'falhou'] as const)(
    'encontra o pedido %s e oferece abrir a ficha',
    async (status) => {
      vi.mocked(conferirEnriquecimento).mockResolvedValue({ id: novo, status });
      montar();
      fireEvent.click(screen.getByRole('button', { name: 'Conferir andamento' }));
      const botao = await screen.findByRole('button', {
        name: status === 'concluido' ? 'Ver resultado' : 'Abrir ficha',
      });
      expect(screen.getByRole('status')).toBeVisible();
      fireEvent.click(botao);
      expect(abrir).toHaveBeenCalledOnce();
      expect(conferirEnriquecimento).toHaveBeenCalledOnce();
    },
  );
  it('limita cliques simultâneos e permite recuperar uma falha de leitura', async () => {
    let falhar!: (e: Error) => void;
    vi.mocked(conferirEnriquecimento).mockReturnValue(
      new Promise((_, reject) => {
        falhar = reject;
      }),
    );
    montar(null);
    const botao = screen.getByRole('button', { name: 'Conferir andamento' });
    act(() => {
      fireEvent.click(botao);
      fireEvent.click(botao);
    });
    expect(screen.getByRole('button', { name: 'Conferindo análise…' })).toBeDisabled();
    expect(conferirEnriquecimento).toHaveBeenCalledOnce();
    act(() => falhar(new Error('segredo interno')));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Reconecte'));
    expect(screen.queryByText(/segredo/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Conferir andamento' })).toBeEnabled();
    expect(screen.getByRole('link', { name: /Pedir ajuda/ })).toHaveAttribute(
      'href',
      '/suporte/novo?origem=%2Fvendas%2Fficha&contexto=enriquecimento',
    );
  });
});
