import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FASES_CRM } from '@/lib/crm/etapas';
import { AbasPipelineMobile, BarraPrioridades } from './ControlesPipeline';

describe('ControlesPipeline', () => {
  it('mostra a prioridade e permite filtrar sem esconder o estado escolhido', async () => {
    const user = userEvent.setup();
    const aoSelecionarFiltro = vi.fn();

    render(
      <BarraPrioridades
        contagens={{ todas: 8, atencao: 3, sem_acao: 2, proposta: 1 }}
        filtro="todas"
        busca=""
        aoSelecionarFiltro={aoSelecionarFiltro}
        aoBuscar={vi.fn()}
      />,
    );

    expect(screen.getByText('3 oportunidades precisam de ação')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Todas: 8' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(screen.getByRole('button', { name: 'Com proposta: 1' }));
    expect(aoSelecionarFiltro).toHaveBeenCalledWith('proposta');
  });

  it('permite buscar e limpar a busca pelo mesmo controle', async () => {
    const user = userEvent.setup();
    const aoBuscar = vi.fn();

    render(
      <BarraPrioridades
        contagens={{ todas: 1, atencao: 0, sem_acao: 0, proposta: 0 }}
        filtro="todas"
        busca="Aurora"
        aoSelecionarFiltro={vi.fn()}
        aoBuscar={aoBuscar}
      />,
    );

    expect(screen.getByText('As vendas estão com caminho definido')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Limpar busca' }));
    expect(aoBuscar).toHaveBeenCalledWith('');
  });

  it('mantém o método de três etapas navegável no celular', async () => {
    const user = userEvent.setup();
    const aoSelecionar = vi.fn();

    render(
      <AbasPipelineMobile
        fases={FASES_CRM.filter((fase) => fase.id !== 'desfecho')}
        faseAtiva="entrada"
        contagem={(fase) => ({ entrada: 4, conversa: 2, proposta: 1, desfecho: 0 })[fase]}
        aoSelecionar={aoSelecionar}
      />,
    );

    expect(screen.getByRole('tab', { name: 'Preparar: 4' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await user.click(screen.getByRole('tab', { name: 'Descobrir: 2' }));
    expect(aoSelecionar).toHaveBeenCalledWith('conversa');
  });
});
