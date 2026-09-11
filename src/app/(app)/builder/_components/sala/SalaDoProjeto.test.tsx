import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { projetoEstudioPreview } from '@/app/preview/estudio-sala/fixture';
import { SalaDoProjeto } from './SalaDoProjeto';

const paineis = {
  criacao: <h2>Plano disponível</h2>,
  entender: <h2>Como funciona</h2>,
  kit: <h2>Kit do projeto</h2>,
  construir: <h2>Tarefas</h2>,
};

describe('Sala do Estúdio', () => {
  it('navega pelo teclado sem inventar conclusão de leitura ou execução', async () => {
    const user = userEvent.setup();
    render(
      <SalaDoProjeto solucao={{ ...projetoEstudioPreview, stack: 'lovable_cloud' }} {...paineis} />,
    );
    const executar = screen.getByRole('tab', { name: 'Executar' });
    expect(executar).toHaveAttribute('aria-selected', 'true');
    executar.focus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: /Preparar/ })).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Kit do projeto');
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Entender' })).toHaveFocus();
    expect(screen.queryByRole('tab', { name: /Entender.*conclu/i })).toBeNull();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');
    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: /Plano/ })).toHaveFocus();
    await user.keyboard('{End}');
    expect(executar).toHaveFocus();
  });

  it('explica a indisponibilidade e não abre um painel bloqueado', async () => {
    render(<SalaDoProjeto solucao={projetoEstudioPreview} {...paineis} />);
    const kit = screen.getByRole('tab', { name: 'Preparar' });
    kit.focus();
    await userEvent.keyboard('{ArrowRight}');
    const executar = screen.getByRole('tab', { name: /Executar/ });
    expect(executar).toHaveFocus();
    expect(executar).toHaveAttribute('aria-disabled', 'true');
    expect(executar).toHaveAccessibleDescription('Escolha onde construir na etapa “Preparar”.');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Kit do projeto');
    await userEvent.keyboard('{ArrowLeft}');
    expect(kit).toHaveFocus();
  });

  it('atualização de ferramenta mantém a preparação aberta e libera tarefas', () => {
    const { rerender } = render(<SalaDoProjeto solucao={projetoEstudioPreview} {...paineis} />);
    rerender(
      <SalaDoProjeto solucao={{ ...projetoEstudioPreview, stack: 'lovable_cloud' }} {...paineis} />,
    );
    expect(screen.getByRole('tab', { name: /Preparar/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Executar' })).toHaveAttribute('aria-disabled', 'false');
  });
});
