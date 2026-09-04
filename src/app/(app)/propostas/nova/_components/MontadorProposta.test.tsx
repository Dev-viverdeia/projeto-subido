import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { OpcoesNovaProposta } from '@/lib/propostas/queries';

vi.mock('@/lib/propostas/actions', () => ({
  criarProposta: vi.fn(),
}));

import { MontadorProposta } from './MontadorProposta';
import { criarProposta } from '@/lib/propostas/actions';

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
  it('escolhe cliente e projeto na mesma tela, sem uma etapa intermediária', async () => {
    const user = userEvent.setup();
    render(
      <MontadorProposta
        opcoes={OPCOES}
        oportunidadeInicial=""
        origemInicial=""
        reuniaoInicial=""
        contextoCall={null}
        erro={null}
      />,
    );

    const continuar = screen.getByRole('button', { name: 'Criar rascunho' });
    expect(continuar).toBeDisabled();
    expect(screen.getByRole('combobox', { name: /Projeto-base/ })).toBeDisabled();

    await user.selectOptions(
      screen.getByRole('combobox', { name: /Cliente em negociação/ }),
      '11111111-1111-4111-8111-111111111111',
    );
    expect(screen.getByRole('combobox', { name: /Projeto-base/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Criar rascunho/ })).toBeDisabled();
    await user.selectOptions(screen.getByRole('combobox', { name: /Projeto-base/ }), 'sem-base');
    expect(continuar).toBeEnabled();
  });

  it('sugere um projeto e deixa o resumo disponível sem poluir a tela', async () => {
    const user = userEvent.setup();
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
        contextoCall={{
          titulo: 'Descoberta · Clínica Aurora',
          resumo: 'A equipe confirmou perda de contexto na troca de turno.',
          decisoes: 2,
          compromissos: 1,
          pontosAValidar: 2,
          oportunidadesProjeto: ['Atendimento assistido por IA no WhatsApp'],
        }}
        erro={null}
      />,
    );

    expect(screen.getByRole('combobox', { name: /Projeto-base/ })).toHaveValue(
      'projeto:sdr-atendimento-qualificacao',
    );
    expect(screen.getByText(/Sugerido pelos dados da reunião/)).toBeVisible();
    expect(screen.getByText(/A equipe confirmou perda de contexto/)).not.toBeVisible();
    await user.click(screen.getByText('Dados da reunião incluídos'));
    expect(screen.getByText(/A equipe confirmou perda de contexto/)).toBeVisible();
    expect(document.querySelectorAll('dt')).toHaveLength(0);
    expect(screen.getByRole('button', { name: /Criar rascunho/ })).toBeEnabled();
  });

  it('remove o vínculo e a sugestão anteriores ao trocar de cliente', async () => {
    const user = userEvent.setup();
    const outro = {
      ...OPCOES.oportunidades[0]!,
      id: '44444444-4444-4444-8444-444444444444',
      empresa: 'Moura Imóveis',
    };
    render(
      <MontadorProposta
        opcoes={{ ...OPCOES, oportunidades: [...OPCOES.oportunidades, outro] }}
        oportunidadeInicial={OPCOES.oportunidades[0]!.id}
        origemInicial="sem-base"
        reuniaoInicial="33333333-3333-4333-8333-333333333333"
        erro={null}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Trocar cliente' }));
    await user.selectOptions(
      screen.getByRole('combobox', { name: /Cliente em negociação/ }),
      outro.id,
    );
    expect(document.querySelector('input[name="reuniao"]')).toHaveValue('');
    expect(screen.getByRole('combobox', { name: /Projeto-base/ })).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Criar rascunho' })).toBeDisabled();
  });

  it('mantém as escolhas e bloqueia novos envios enquanto prepara o rascunho', async () => {
    const user = userEvent.setup();
    let concluir!: () => void;
    vi.mocked(criarProposta).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          concluir = resolve;
        }),
    );
    render(
      <MontadorProposta
        opcoes={OPCOES}
        oportunidadeInicial={OPCOES.oportunidades[0]!.id}
        origemInicial="sem-base"
        reuniaoInicial=""
        erro="salvar"
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Suas escolhas foram mantidas');
    await user.click(screen.getByRole('button', { name: 'Criar rascunho' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Preparando rascunho/ })).toBeDisabled(),
    );
    expect(screen.getByRole('combobox', { name: /Projeto-base/ })).toBeDisabled();
    await act(async () => {
      concluir();
      await Promise.resolve();
    });
  });

  it('explica a descoberta obrigatória e devolve o usuário para a próxima ação', () => {
    render(
      <MontadorProposta
        opcoes={{ ...OPCOES, oportunidades: [] }}
        oportunidadeInicial="11111111-1111-4111-8111-111111111111"
        origemInicial=""
        reuniaoInicial=""
        contextoCall={null}
        erro="descoberta"
      />,
    );

    expect(screen.getByText('Conclua a descoberta antes de criar a proposta.')).toBeVisible();
    expect(screen.getByRole('link', { name: /Agendar descoberta/ })).toHaveAttribute(
      'href',
      '/reunioes?nova=1&oportunidade=11111111-1111-4111-8111-111111111111',
    );
  });
});
