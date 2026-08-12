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
      empresa: 'Clínica Aurora',
      dominio: 'clinicaaurora.com.br',
      contato: 'Camila Rios',
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
        contextoCall={null}
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
    expect(screen.getByRole('button', { name: /Criar rascunho para revisar/ })).toBeDisabled();
  });

  it('recomenda o Projeto compatível quando a oportunidade já vem da call', () => {
    render(
      <MontadorProposta
        opcoes={{
          ...OPCOES,
          projetos: [
            {
              id: '22222222-2222-4222-8222-222222222222',
              slug: 'sdr-atendimento-qualificacao',
              titulo: 'SDR de Atendimento e Qualificação',
              resumo: 'Atendimento conectado e rastreável.',
              categoria: 'atendimento',
              publicado_em: '2026-08-01T12:00:00Z',
              criado_em: '2026-08-01T12:00:00Z',
              etapaIds: [],
              ferramentas: [],
              projeto: {} as OpcoesNovaProposta['projetos'][number]['projeto'],
            },
          ],
        }}
        oportunidadeInicial="11111111-1111-4111-8111-111111111111"
        origemInicial=""
        reuniaoInicial="33333333-3333-4333-8333-333333333333"
        diagnosticoInicial=""
        contextoCall={{
          titulo: 'Descoberta · Clínica Aurora',
          resumo: 'A equipe confirmou perda de contexto na troca de turno.',
          decisoes: 2,
          compromissos: 1,
          pontosAValidar: 2,
          oportunidadesProjeto: ['Atendimento assistido por IA no WhatsApp'],
        }}
        erro={false}
      />,
    );

    expect(screen.getByRole('combobox', { name: /Projeto-base/ })).toHaveValue(
      'projeto:sdr-atendimento-qualificacao',
    );
    expect(screen.getByText(/Recomendado pelo contexto da call/)).toBeVisible();
    expect(screen.getByText(/A equipe confirmou perda de contexto/)).toBeVisible();
    expect(screen.getAllByText('2', { selector: 'dt' })).toHaveLength(2);
    expect(screen.getByRole('button', { name: /Criar rascunho para revisar/ })).toBeEnabled();
  });
});
