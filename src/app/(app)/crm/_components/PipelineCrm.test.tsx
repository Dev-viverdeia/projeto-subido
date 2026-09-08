import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { OportunidadeCrm } from '@/lib/crm/pipeline-queries';
import { PipelineCrm } from './PipelineCrm';

vi.mock('@/lib/crm/actions', () => ({ moverOportunidadeKanban: vi.fn() }));
vi.mock('./AcoesOportunidade', () => ({ AcoesOportunidade: () => null }));

const VENDA: OportunidadeCrm = {
  id: 'venda-1',
  titulo: 'Atendimento com IA · Clínica Aurora',
  etapa: 'descoberta',
  empresaId: 'empresa-1',
  empresa: 'Clínica Aurora',
  dominio: null,
  enriquecidoEm: null,
  enriquecimentoStatus: null,
  contatoId: null,
  contato: null,
  contatoEmail: null,
  valorCentavos: 1200000,
  proximaAcao: 'Finalizar proposta',
  proximaAcaoEm: null,
  ganhaEm: null,
  perdidaEm: null,
  motivoPerda: null,
  ultimoFato: null,
  ultimoFatoEm: null,
  atualizadoEm: '2026-09-08T12:00:00Z',
  criadoEm: '2026-09-01T12:00:00Z',
  propostaRecente: { id: 'proposta-1', status: 'rascunho' },
};

describe('Jornada do kanban', () => {
  it('mostra rascunhos no filtro e seleciona a etapa com resultados no celular', async () => {
    const user = userEvent.setup();
    render(
      <PipelineCrm
        oportunidades={[
          VENDA,
          {
            ...VENDA,
            id: 'venda-2',
            empresa: 'Sem documento',
            etapa: 'proposta',
            propostaRecente: null,
          },
        ]}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Com proposta: 1' }));
    expect(screen.getByRole('tab', { name: 'Descobrir: 1' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.queryByRole('heading', { name: 'Sem documento' })).toBeNull();
    expect(
      screen.getByRole('link', { name: 'Continuar proposta: Clínica Aurora' }),
    ).toHaveAttribute('href', '/propostas/proposta-1');
    await user.click(screen.getByRole('tab', { name: 'Preparar: 0' }));
    expect(screen.getByRole('tab', { name: 'Preparar: 0' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('mantém acesso à ficha e não repete a empresa no nome do projeto', () => {
    render(<PipelineCrm oportunidades={[VENDA]} />);
    const cartao = screen.getByRole('group', { name: /Arraste para mudar de etapa/ });
    expect(within(cartao).getByRole('link', { name: 'Clínica Aurora' })).toHaveAttribute(
      'href',
      '/vendas/venda-1',
    );
    expect(within(cartao).getByText('Atendimento com IA', { exact: true })).toBeVisible();
  });

  it('a busca revela a etapa da venda encontrada sem mudar a etapa salva', async () => {
    const user = userEvent.setup();
    render(<PipelineCrm oportunidades={[VENDA]} />);
    await user.type(screen.getByRole('searchbox', { name: 'Buscar vendas' }), 'aurora');
    expect(screen.getByRole('tab', { name: 'Descobrir: 1' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });
});
