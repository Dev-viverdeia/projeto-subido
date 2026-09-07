import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const criar = vi.hoisted(() => vi.fn());
vi.mock('@/lib/prospeccao/actions', () => ({ criarListaProspeccao: criar }));
import { FormularioBusca } from './FormularioBusca';

describe('Busca em conexão instável', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  });

  function preencher() {
    render(<FormularioBusca saldo={30} pronto />);
    fireEvent.change(screen.getByLabelText('Tipo de empresa'), { target: { value: 'Clínicas' } });
    fireEvent.change(screen.getByLabelText('Cidade ou região'), { target: { value: 'Recife' } });
  }

  it('não inicia uma busca paga offline e mantém os campos', () => {
    preencher();
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    fireEvent.click(screen.getByRole('button', { name: 'Buscar empresas' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Sem conexão');
    expect(screen.getByLabelText('Tipo de empresa')).toHaveValue('Clínicas');
    expect(screen.getByLabelText('Cidade ou região')).toHaveValue('Recife');
    expect(criar).not.toHaveBeenCalled();
  });

  it('preserva o recorte em falha de transporte sem confirmar estorno ou repetir', async () => {
    criar.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    preencher();
    fireEvent.click(screen.getByRole('button', { name: 'Buscar empresas' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('A busca não foi confirmada');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Buscar empresas' })).toBeEnabled(),
    );
    expect(screen.getByLabelText('Tipo de empresa')).toHaveValue('Clínicas');
    expect(screen.getByLabelText('Cidade ou região')).toHaveValue('Recife');
    expect(criar).toHaveBeenCalledTimes(1);
  });

  it('reenvia a mesma solicitação após perder a resposta, mas muda a chave ao mudar o recorte', async () => {
    const pedidos: unknown[] = [];
    criar.mockImplementation((_estado, dados: FormData) => {
      pedidos.push(dados.get('pedido'));
      return Promise.reject(new TypeError('Failed to fetch'));
    });
    preencher();
    const enviar = async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Buscar empresas' }));
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Buscar empresas' })).toBeEnabled(),
      );
    };
    await enviar();
    await enviar();
    expect(pedidos[0]).toEqual(expect.stringMatching(/^[0-9a-f-]{36}$/));
    expect(pedidos[1]).toBe(pedidos[0]);
    fireEvent.change(screen.getByLabelText('Cidade ou região'), { target: { value: 'Olinda' } });
    await enviar();
    expect(pedidos[2]).not.toBe(pedidos[0]);
  });
});
