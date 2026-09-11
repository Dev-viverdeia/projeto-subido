import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { EstadoTarefa } from '@/lib/builder/queries';
import { projetoEstudioPreview } from '@/app/preview/estudio-sala/fixture';
import { Kanban } from './Kanban';

vi.mock('@/lib/builder/actions', () => ({ moverTarefa: vi.fn() }));
const etapas = projetoEstudioPreview.documento!.etapas;

describe('Tarefa em foco no Estúdio', () => {
  it('abre o trabalho em curso, preserva instruções inteiras e não grava ao navegar', async () => {
    const salvar = vi.fn();
    render(
      <Kanban
        id="projeto"
        etapas={etapas}
        tarefas={{ 0: 'feito', 2: 'fazendo' }}
        salvar={salvar}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Construir o fluxo' })).toBeVisible();
    expect(screen.getByRole('article')).toHaveTextContent(
      etapas[2]!.descricao.replace(/\s+/g, ' '),
    );
    await userEvent.click(
      within(screen.getByRole('navigation')).getByRole('button', { name: /Aprovar as respostas/ }),
    );
    expect(screen.getByRole('heading', { name: 'Aprovar as respostas' })).toBeVisible();
    expect(salvar).not.toHaveBeenCalled();
  });

  it('filtra fases e estados sem ocultar uma saída para o filtro vazio', async () => {
    render(<Kanban id="projeto" etapas={etapas} tarefas={{}} salvar={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /Concluídas/ }));
    expect(screen.getByRole('heading', { name: 'Nenhuma tarefa neste filtro' })).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Ver todas as tarefas' }));
    await userEvent.selectOptions(screen.getByRole('combobox'), '3');
    expect(screen.getByRole('navigation').querySelectorAll('button')).toHaveLength(2);
  });

  it('aguarda a gravação e bloqueia duplo envio sem concluir de forma otimista', async () => {
    let resolver!: (resultado: { ok: boolean }) => void;
    const salvar = vi.fn<(dados: FormData) => Promise<{ ok: boolean }>>(
      () =>
        new Promise<{ ok: boolean }>((resolve) => {
          resolver = resolve;
        }),
    );
    render(<Kanban id="projeto" etapas={etapas} tarefas={{ 2: 'fazendo' }} salvar={salvar} />);
    await userEvent.click(screen.getByRole('button', { name: 'Concluir tarefa' }));
    expect(screen.getByRole('button', { name: 'Salvando…' })).toBeDisabled();
    expect(screen.getByRole('article')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText('Conclusão registrada.', { exact: false })).toBeNull();
    resolver({ ok: true });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Concluir tarefa' })).toBeEnabled(),
    );
    expect(salvar).toHaveBeenCalledOnce();
    expect(salvar.mock.calls[0]?.[0].get('id')).toBe('projeto');
    expect(salvar.mock.calls[0]?.[0].get('indice')).toBe('2');
    expect(salvar.mock.calls[0]?.[0].get('estado')).toBe('feito');
  });

  it.each(['rejeitada', 'conexao'])(
    'mantém a tarefa após falha %s e permite tentar novamente',
    async (tipo) => {
      const salvar = vi.fn();
      if (tipo === 'conexao') salvar.mockRejectedValueOnce(new Error('detalhe interno'));
      else salvar.mockResolvedValueOnce({ ok: false });
      salvar.mockResolvedValue({ ok: true });
      render(<Kanban id="projeto" etapas={etapas} tarefas={{ 2: 'fazendo' }} salvar={salvar} />);
      await userEvent.click(screen.getByRole('button', { name: 'Concluir tarefa' }));
      expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível salvar');
      expect(screen.queryByText('detalhe interno')).toBeNull();
      await userEvent.click(screen.getByRole('button', { name: 'Concluir tarefa' }));
      await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
      expect(salvar).toHaveBeenCalledTimes(2);
    },
  );

  it('conclui e reabre somente a tarefa escolhida, sem saltar o conteúdo', async () => {
    const gravar = vi.fn();
    function Cenario() {
      const [tarefas, setTarefas] = useState<Record<number, EstadoTarefa>>({ 2: 'fazendo' });
      return (
        <Kanban
          id="projeto"
          etapas={etapas}
          tarefas={tarefas}
          salvar={(dados) => {
            gravar(dados.get('indice'), dados.get('estado'));
            setTarefas((antes) => ({
              ...antes,
              [Number(dados.get('indice'))]: dados.get('estado') as EstadoTarefa,
            }));
            return Promise.resolve({ ok: true });
          }}
        />
      );
    }
    render(<Cenario />);
    await userEvent.click(screen.getByRole('button', { name: 'Concluir tarefa' }));
    expect(screen.getByRole('heading', { name: 'Construir o fluxo' })).toBeVisible();
    expect(gravar).toHaveBeenLastCalledWith('2', 'feito');
    await userEvent.click(screen.getByRole('button', { name: 'Reabrir tarefa' }));
    expect(gravar).toHaveBeenLastCalledWith('2', 'fazendo');
    expect(screen.getByRole('button', { name: 'Concluir tarefa' })).toBeEnabled();
  });

  it('conclusão do plano não é apresentada como aceite do cliente', () => {
    render(
      <Kanban
        id="projeto"
        etapas={etapas}
        tarefas={Object.fromEntries(etapas.map((_, i) => [i, 'feito']))}
        salvar={vi.fn()}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'A entrega ao cliente é gerenciada em Entregas',
    );
    expect(screen.getByRole('button', { name: 'Reabrir tarefa' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Abrir próxima tarefa' })).toBeNull();
  });
});
