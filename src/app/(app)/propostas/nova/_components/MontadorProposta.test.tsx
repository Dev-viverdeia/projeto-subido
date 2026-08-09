import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { OpcoesNovaProposta } from '@/lib/propostas/queries';

vi.mock('@/lib/propostas/actions', () => ({
  criarProposta: vi.fn(),
}));

import { MontadorProposta } from './MontadorProposta';

const OPCOES: OpcoesNovaProposta = {
  oportunidades: [
    {
      id: '11111111-1111-4111-8111-111111111111',
      titulo: 'Automação do atendimento',
      etapa: 'descoberta',
      empresaId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      empresa: 'Clínica Aurora',
      dominio: 'clinicaaurora.com.br',
      enriquecidoEm: null,
      enriquecimentoStatus: null,
      contatoId: null,
      contato: 'Camila Rios',
      contatoEmail: null,
      valorCentavos: null,
      proximaAcao: null,
      proximaAcaoEm: null,
      ultimoFato: null,
      ultimoFatoEm: null,
      atualizadoEm: new Date().toISOString(),
      criadoEm: new Date().toISOString(),
    },
  ],
  projetos: [],
  projetosEstudio: [],
};

describe('MontadorProposta', () => {
  it('mostra apenas uma decisão por vez e leva o contexto para a entrega', async () => {
    const user = userEvent.setup();
    render(
      <MontadorProposta
        opcoes={OPCOES}
        oportunidadeInicial=""
        origemInicial=""
        reuniaoInicial=""
        diagnosticoInicial=""
        erro={false}
      />,
    );

    const continuar = screen.getByRole('button', { name: 'Continuar' });
    expect(continuar).toBeDisabled();
    expect(screen.queryByRole('combobox', { name: /Projeto-base/ })).not.toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole('combobox', { name: /Lead do CRM/ }),
      '11111111-1111-4111-8111-111111111111',
    );
    await user.click(continuar);

    expect(screen.getByRole('combobox', { name: /Projeto-base/ })).toBeInTheDocument();
    expect(screen.getByText('Clínica Aurora')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Montar proposta/ })).toBeDisabled();
  });
});
