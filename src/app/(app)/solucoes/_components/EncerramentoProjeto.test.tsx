import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { salvarEncerramentoProjeto } from '@/lib/projetos-execucao/encerramento-actions';
import { EncerramentoProjeto } from './EncerramentoProjeto';

vi.mock('@/lib/projetos-execucao/encerramento-actions', () => ({
  salvarEncerramentoProjeto: vi.fn(),
}));

describe('EncerramentoProjeto', () => {
  it('começa o resultado público vazio e preserva o texto se o servidor recusar', async () => {
    vi.mocked(salvarEncerramentoProjeto).mockResolvedValue({ erro: 'Complete o combinado.' });
    render(
      <EncerramentoProjeto projetoId="11111111-1111-4111-8111-111111111111" encerramento={null} />,
    );
    const resultado = screen.getByLabelText('Principal resultado observado');
    expect(resultado).toHaveValue('');
    fireEvent.change(resultado, {
      target: { value: 'Resultado revisado para compartilhar com o cliente.' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'Salvar encerramento' }).closest('form')!);
    expect(await screen.findByRole('alert')).toHaveTextContent('Encerramento não confirmado');
    expect(resultado).toHaveValue('Resultado revisado para compartilhar com o cliente.');
  });
});
