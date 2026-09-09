import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import './SalaEntrega.test-mocks';
import { agendarAcompanhamento } from '@/lib/projetos-execucao/gestao-actions';
import { AcompanhamentoEntrega } from './AcompanhamentoEntrega';
import { PROJETO } from './SalaEntrega.test-fixtures';

afterEach(cleanup);
beforeEach(() => {
  vi.mocked(agendarAcompanhamento).mockReset();
});

function preparar() {
  render(<AcompanhamentoEntrega projeto={{ ...PROJETO, acoesPlano: [] }} />);
  fireEvent.click(screen.getByRole('button', { name: 'Agendar ação' }));
  fireEvent.change(screen.getByLabelText('O que você vai fazer?'), {
    target: { value: 'Revisar os indicadores' },
  });
  fireEvent.change(screen.getByLabelText('Quando'), { target: { value: '2026-10-15' } });
  return within(screen.getByRole('dialog')).getByRole('button', { name: 'Agendar ação' });
}

describe('acompanhamento recorrente', () => {
  it('mantém o modal ocupado até a confirmação do servidor', async () => {
    let resolver!: (r: { sucesso: string }) => void;
    vi.mocked(agendarAcompanhamento).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolver = resolve;
        }),
    );
    fireEvent.click(preparar());
    expect(await screen.findByRole('button', { name: 'Salvando…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await act(() => {
      resolver({ sucesso: 'Próxima ação agendada.' });
      return Promise.resolve();
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Próxima ação agendada.');
  });

  it('preserva a revisão e o mesmo identificador ao repetir depois de falha', async () => {
    vi.mocked(agendarAcompanhamento)
      .mockResolvedValueOnce({ erro: 'Conexão interrompida.' })
      .mockResolvedValueOnce({ sucesso: 'Próxima ação agendada.' });
    fireEvent.click(preparar());
    expect(await screen.findByRole('alert')).toHaveTextContent('Conexão interrompida.');
    expect(screen.getByLabelText('O que você vai fazer?')).toHaveValue('Revisar os indicadores');
    expect(screen.getByLabelText('Quando')).toHaveValue('2026-10-15');
    const primeiro = vi.mocked(agendarAcompanhamento).mock.calls[0]![1];
    // O erro pode aparecer antes de o React encerrar a transição de salvamento.
    const repetir = await within(screen.getByRole('dialog')).findByRole('button', {
      name: 'Agendar ação',
    });
    await waitFor(() => expect(repetir).toBeEnabled());
    fireEvent.click(repetir);
    expect(await screen.findByRole('status')).toHaveTextContent('Próxima ação agendada.');
    const segundo = vi.mocked(agendarAcompanhamento).mock.calls[1]![1];
    expect(segundo.get('acao')).toBe(primeiro.get('acao'));
    expect(segundo.get('projeto')).toBe(PROJETO.id);
  });
});
