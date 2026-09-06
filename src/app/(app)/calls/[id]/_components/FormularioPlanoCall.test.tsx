import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';

vi.mock('@/lib/calls/plano-actions', () => ({
  salvarPlanoCall: vi.fn(),
}));

import { salvarPlanoCall } from '@/lib/calls/plano-actions';
import { FormularioPlanoCall } from './FormularioPlanoCall';

beforeEach(() => vi.clearAllMocks());

describe('FormularioPlanoCall', () => {
  it('deixa o plano recomendado pronto para uma única confirmação', () => {
    render(
      <FormularioPlanoCall
        reuniaoId="11111111-1111-4111-8111-111111111111"
        oportunidadeId="22222222-2222-4222-8222-222222222222"
        acaoInicial="Enviar o diagnóstico do piloto."
        dataInicial="2026-08-15"
        etapaAtual="descoberta"
        etapaSugerida="proposta"
        compromissos={[
          'Marina enviará a amostra anonimizada.',
          'O prestador devolverá o diagnóstico.',
        ]}
      />,
    );

    expect(screen.getByLabelText('Próxima ação da venda')).toHaveValue(
      'Enviar o diagnóstico do piloto.',
    );
    expect(screen.getByLabelText('Próxima etapa da venda')).toHaveValue('proposta');
    const compromissos = screen.getAllByRole('checkbox');
    expect(compromissos).toHaveLength(2);
    compromissos.forEach((item) => expect(item).toBeChecked());
    expect(screen.getByRole('button', { name: 'Confirmar e atualizar a venda' })).toBeEnabled();
  });

  it.each(['servidor', 'conexao'] as const)(
    'mantém texto, data, etapa e seleção após falha de %s',
    async (falha) => {
      const user = userEvent.setup();
      if (falha === 'servidor')
        vi.mocked(salvarPlanoCall).mockResolvedValueOnce({ erro: 'Suas escolhas foram mantidas.' });
      else vi.mocked(salvarPlanoCall).mockRejectedValueOnce(new Error('Network error'));
      render(
        <FormularioPlanoCall
          reuniaoId="reuniao"
          oportunidadeId="cliente"
          acaoInicial="Ação sugerida"
          dataInicial="2026-09-10"
          etapaAtual="descoberta"
          etapaSugerida="proposta"
          compromissos={['Enviar amostra', 'Revisar o escopo']}
        />,
      );
      await user.clear(screen.getByLabelText('Próxima ação da venda'));
      await user.type(
        screen.getByLabelText('Próxima ação da venda'),
        'Apresentar escopo validado pela equipe',
      );
      await user.selectOptions(screen.getByLabelText('Próxima etapa da venda'), 'manter');
      await user.click(screen.getAllByRole('checkbox')[1]!);
      expect(screen.getAllByRole('checkbox')[1]).not.toBeChecked();
      await user.click(screen.getByRole('button', { name: 'Confirmar e atualizar a venda' }));
      expect(await screen.findByRole('alert')).toHaveTextContent(
        falha === 'conexao' ? 'Salvamento não confirmado' : 'O plano não foi salvo',
      );
      expect(screen.getByLabelText('Próxima ação da venda')).toHaveValue(
        'Apresentar escopo validado pela equipe',
      );
      expect(screen.getByLabelText('Data combinada')).toHaveValue('2026-09-10');
      expect(screen.getByLabelText('Próxima etapa da venda')).toHaveValue('manter');
      expect(screen.getAllByRole('checkbox')[1]).not.toBeChecked();
      vi.mocked(salvarPlanoCall).mockResolvedValueOnce({
        sucesso: 'Plano salvo na ficha do cliente.',
      });
      await user.click(screen.getByRole('button', { name: 'Confirmar e atualizar a venda' }));
      expect(await screen.findByRole('status')).toHaveTextContent('Plano salvo');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Próxima ação da venda')).toHaveValue(
        'Apresentar escopo validado pela equipe',
      );
    },
  );
});
