import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import './SalaEntrega.test-mocks';
import { gerenciarEntrega } from '@/lib/projetos-execucao/gestao-actions';
import { GestaoServico } from './GestaoServico';
import { PROJETO } from './SalaEntrega.test-fixtures';
afterEach(cleanup);
beforeEach(() => vi.mocked(gerenciarEntrega).mockResolvedValue({ sucesso: 'Entrega concluída.' }));
describe('GestaoServico', () => {
  it('preserva o aceite de pendências no formulário após falha e oferece conferência', async () => {
    vi.mocked(gerenciarEntrega).mockRejectedValueOnce(new Error('private detail'));
    render(<GestaoServico projeto={PROJETO} onConcluir={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Concluir entrega' }));
    const d = within(screen.getByRole('dialog'));
    fireEvent.click(d.getByRole('checkbox'));
    fireEvent.click(d.getByRole('button', { name: 'Concluir entrega' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Confira os dados atuais');
    expect(d.getByRole('checkbox')).toBeChecked();
    expect(d.getByRole('button', { name: 'Atualizar dados' })).toBeEnabled();
    expect(d.getByRole('link', { name: /Pedir ajuda/ })).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('alert')).not.toHaveTextContent('private detail');
  });
  it('mostra a confirmação de pendências sem declarar aceite', () => {
    render(<GestaoServico projeto={PROJETO} onConcluir={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Concluir entrega' }));
    const d = screen.getByRole('dialog');
    expect(within(d).getByRole('checkbox')).toBeRequired();
    expect(within(d).getByText(/O aceite do cliente continua separado/)).toBeInTheDocument();
  });
  it('mantém loading dentro do modal e bloqueia a saída durante o envio', async () => {
    let concluir!: (valor: { sucesso: string }) => void;
    vi.mocked(gerenciarEntrega).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          concluir = resolve;
        }),
    );
    const final = vi.fn();
    render(
      <GestaoServico projeto={{ ...PROJETO, tarefas: [], acoesPlano: [] }} onConcluir={final} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Concluir entrega' }));
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Concluir entrega' }),
    );
    expect(await screen.findByRole('button', { name: 'Salvando…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await act(() => {
      concluir({ sucesso: 'Entrega concluída.' });
      return Promise.resolve();
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(final).toHaveBeenCalledOnce();
  });
  it('mantém a confirmação aberta depois de uma falha', async () => {
    vi.mocked(gerenciarEntrega).mockResolvedValueOnce({ erro: 'Não foi possível salvar.' });
    render(
      <GestaoServico projeto={{ ...PROJETO, tarefas: [], acoesPlano: [] }} onConcluir={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Concluir entrega' }));
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Concluir entrega' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível salvar.');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
  it('diferencia recorrente ativo de acompanhamento encerrado', () => {
    const { rerender } = render(
      <GestaoServico
        projeto={{ ...PROJETO, status: 'concluido', tipoServico: 'recorrente' }}
        onConcluir={vi.fn()}
      />,
    );
    expect(screen.getByText('Em acompanhamento')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Encerrar acompanhamento' })).toBeInTheDocument();
    rerender(
      <GestaoServico
        projeto={{
          ...PROJETO,
          status: 'concluido',
          tipoServico: 'recorrente',
          recorrenciaEncerradaEm: '2026-09-08',
        }}
        onConcluir={vi.fn()}
      />,
    );
    expect(screen.queryByText('Em acompanhamento')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Gerenciar' }));
    expect(screen.getByRole('button', { name: 'Retomar acompanhamento' })).toBeInTheDocument();
  });
});
