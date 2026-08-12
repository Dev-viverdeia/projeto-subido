import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/calls/actions', () => ({
  aplicarPlanoCall: vi.fn(),
}));

import { FormularioPlanoCall } from './FormularioPlanoCall';

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

    expect(screen.getByLabelText('Próxima ação no CRM')).toHaveValue(
      'Enviar o diagnóstico do piloto.',
    );
    expect(screen.getByLabelText('Destino no pipeline')).toHaveValue('proposta');
    const compromissos = screen.getAllByRole('checkbox');
    expect(compromissos).toHaveLength(2);
    compromissos.forEach((item) => expect(item).toBeChecked());
    expect(screen.getByRole('button', { name: 'Confirmar e atualizar CRM' })).toBeEnabled();
  });
});
