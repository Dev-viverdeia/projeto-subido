import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/projetos-execucao/actions', () => ({
  iniciarProjetoExecucao: vi.fn(),
}));

import { AcaoEntrega } from './AcaoEntrega';

const PROPOSTA_ID = '11111111-1111-4111-8111-111111111111';
const PROJETO_ID = '22222222-2222-4222-8222-222222222222';

describe('AcaoEntrega', () => {
  it('leva direto à execução quando o projeto já está ativo', () => {
    render(<AcaoEntrega propostaId={PROPOSTA_ID} execucaoId={PROJETO_ID} />);

    expect(screen.getByRole('link', { name: /Abrir entrega/i })).toHaveAttribute(
      'href',
      `/entregas/${PROJETO_ID}`,
    );
  });

  it('mantém uma ação de recuperação quando o projeto ainda não existe', () => {
    render(<AcaoEntrega propostaId={PROPOSTA_ID} execucaoId={null} />);

    expect(screen.getByRole('button', { name: /Criar projeto/i })).toBeEnabled();
  });
});
