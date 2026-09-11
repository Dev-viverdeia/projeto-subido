import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { EstadoDecisaoProposta } from '@/lib/propostas/portal-actions';
import { DecisaoCliente } from './DecisaoCliente';

vi.mock('@/lib/propostas/portal-actions', () => ({ decidirPropostaCliente: vi.fn() }));

const props = {
  codigo: '00000000-0000-4000-8000-000000000000',
  nomeInicial: 'Camila Rios',
  emailInicial: 'camila@example.com',
  linkPagamento: 'https://example.com/pagamento',
  valorCentavos: 1850000,
};

describe('decisão do cliente', () => {
  it('mantém texto e aceite, e leva o foco ao erro quando o envio falha', async () => {
    const action = vi
      .fn()
      .mockResolvedValue({ erro: 'Não foi possível registrar. Tente novamente.' });
    const user = userEvent.setup();
    render(<DecisaoCliente {...props} submitAction={action} />);
    await user.clear(screen.getByLabelText('Seu nome'));
    await user.type(screen.getByLabelText('Seu nome'), 'Camila Souza');
    await user.type(screen.getByLabelText(/Comentário/), 'Iniciar na segunda-feira.');
    await user.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('checkbox')).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Aprovar proposta' }));
    expect(await screen.findByRole('alert')).toHaveFocus();
    expect(screen.getByLabelText('Seu nome')).toHaveValue('Camila Souza');
    expect(screen.getByLabelText(/Comentário/)).toHaveValue('Iniciar na segunda-feira.');
    const formData = action.mock.calls[0]![1] as FormData;
    expect(formData.get('aceiteTermos')).toBe('sim');
    expect(formData.get('decisao')).toBe('aceita');
    expect(formData.get('codigo')).toBe(props.codigo);
    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(await screen.findByRole('button', { name: 'Aprovar proposta' })).toBeEnabled();
  });

  it('bloqueia as duas ações durante o envio e mostra a confirmação com pagamento', async () => {
    let resolver!: (estado: EstadoDecisaoProposta) => void;
    const action = vi.fn(
      () =>
        new Promise<EstadoDecisaoProposta>((resolve) => {
          resolver = resolve;
        }),
    );
    const user = userEvent.setup();
    render(<DecisaoCliente {...props} submitAction={action} />);
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Aprovar proposta' }));
    expect(screen.getByRole('button', { name: 'Aprovando…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Não aprovar proposta' })).toBeDisabled();
    expect(screen.getByLabelText('Seu nome')).toHaveAttribute('readonly');
    await user.click(screen.getByRole('button', { name: 'Aprovando…' }));
    expect(action).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolver({ sucesso: 'Decisão registrada.', status: 'aceita' });
      await Promise.resolve();
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Proposta aprovada');
    expect(screen.getByRole('link', { name: 'Abrir pagamento' })).toHaveAttribute(
      'href',
      props.linkPagamento,
    );
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
  });

  it('registra a recusa sem concordância obrigatória e sem sugerir pagamento', async () => {
    const action = vi
      .fn()
      .mockResolvedValue({ sucesso: 'Retorno registrado.', status: 'recusada' });
    const user = userEvent.setup();
    render(<DecisaoCliente {...props} submitAction={action} />);
    await user.click(screen.getByRole('button', { name: 'Não aprovar proposta' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Proposta não aprovada');
    const dados = action.mock.calls[0]![1] as FormData;
    expect(dados.get('decisao')).toBe('recusada');
    expect(dados.get('aceiteTermos')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Abrir pagamento' })).not.toBeInTheDocument();
  });

  it('falha de conexão não quebra a tela nem apaga o comentário', async () => {
    const action = vi.fn().mockRejectedValue(new Error('Falha de transporte'));
    const user = userEvent.setup();
    render(<DecisaoCliente {...props} submitAction={action} />);
    await user.type(screen.getByLabelText(/Comentário/), 'Preciso revisar o prazo.');
    await user.click(screen.getByRole('button', { name: 'Não aprovar proposta' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Seus dados continuam aqui');
    expect(screen.getByLabelText(/Comentário/)).toHaveValue('Preciso revisar o prazo.');
  });

  it('não inventa valor ou link de pagamento quando não foram definidos', async () => {
    const action = vi.fn().mockResolvedValue({ sucesso: 'Decisão registrada.', status: 'aceita' });
    const user = userEvent.setup();
    render(
      <DecisaoCliente {...props} valorCentavos={null} linkPagamento={null} submitAction={action} />,
    );
    expect(screen.getByText('A definir')).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Aprovar proposta' }));
    await screen.findByRole('status');
    expect(screen.queryByRole('link', { name: 'Abrir pagamento' })).not.toBeInTheDocument();
  });
});
