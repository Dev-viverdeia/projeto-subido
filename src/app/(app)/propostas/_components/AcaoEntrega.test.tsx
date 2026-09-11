import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { iniciarProjetoExecucao } from '@/lib/projetos-execucao/actions';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/projetos-execucao/actions', () => ({
  iniciarProjetoExecucao: vi.fn(),
}));

import { AcaoEntrega } from './AcaoEntrega';

const PROPOSTA_ID = '11111111-1111-4111-8111-111111111111';
const PROJETO_ID = '22222222-2222-4222-8222-222222222222';

describe('AcaoEntrega', () => {
  it('permite repetir após falha sem perder a proposta original', async () => {
    vi.mocked(iniciarProjetoExecucao).mockResolvedValue({
      erro: 'A conexão falhou. Tente novamente.',
    });
    const user = userEvent.setup();
    const { container } = render(<AcaoEntrega propostaId={PROPOSTA_ID} execucaoId={null} />);
    await user.click(screen.getByRole('button', { name: 'Preparar entrega' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Tente novamente');
    expect(container.querySelector('input[name="proposta"]')).toHaveValue(PROPOSTA_ID);
    expect(screen.getByRole('button', { name: 'Preparar entrega' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Preparar entrega' }));
    expect(
      vi
        .mocked(iniciarProjetoExecucao)
        .mock.calls.slice(-2)
        .map((c) => c[1].get('proposta')),
    ).toEqual([PROPOSTA_ID, PROPOSTA_ID]);
  });
  it('leva direto à execução quando o projeto já está ativo', () => {
    render(<AcaoEntrega propostaId={PROPOSTA_ID} execucaoId={PROJETO_ID} />);

    expect(screen.getByRole('link', { name: /Abrir entrega/i })).toHaveAttribute(
      'href',
      `/entregas/${PROJETO_ID}`,
    );
  });

  it('mantém uma ação de recuperação quando o projeto ainda não existe', () => {
    render(<AcaoEntrega propostaId={PROPOSTA_ID} execucaoId={null} />);

    expect(screen.getByRole('button', { name: /Preparar entrega/i })).toBeEnabled();
  });
});
