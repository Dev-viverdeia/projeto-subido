import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
const { renomear } = vi.hoisted(() => ({ renomear: vi.fn() }));
vi.mock('@/lib/consultor/renomear', () => ({ renomearConversa: renomear }));
import { ListaConversas } from './ListaConversas';
import { HistoricoDropdown } from '@/app/(app)/_components/HistoricoDropdown';
const dono = '11111111-1111-4111-8111-111111111111';
const thread = {
  id: '33333333-3333-4333-8333-333333333333',
  titulo: 'Clínica Horizonte',
  criadoEm: '2026-09-09T12:00:00Z',
  atualizadoEm: '2026-09-10T12:00:00Z',
};
beforeEach(() => {
  vi.restoreAllMocks();
  renomear.mockReset();
});
it('busca conversas antigas no servidor e limpa o filtro', async () => {
  const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(
      JSON.stringify({
        threads: [{ ...thread, titulo: 'Conversa antiga' }],
        total: 1,
        mais: false,
      }),
    ),
  );
  render(<ListaConversas threads={[thread]} total={60} dono={dono} />);
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'antiga' } });
  await screen.findByRole('link', { name: /Conversa antiga/ });
  expect(fetch.mock.calls[0]?.[0]).toContain('busca=antiga');
  fireEvent.click(screen.getByRole('button', { name: 'Limpar busca' }));
  expect(screen.getByRole('link', { name: /Clínica Horizonte/ })).toBeVisible();
});
it('não anuncia salvo se o servidor falhar e mantém o nome digitado', async () => {
  renomear.mockRejectedValue(new Error('rede'));
  render(<ListaConversas threads={[thread]} dono={dono} />);
  fireEvent.click(screen.getByRole('button', { name: /Renomear Clínica/ }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Nome da conversa' }), {
    target: { value: 'Meu projeto' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar nome' }));
  await screen.findByRole('alert');
  expect(screen.getByRole('textbox')).toHaveValue('Meu projeto');
  expect(screen.queryByText('Nome salvo.')).not.toBeInTheDocument();
});
it('salva uma vez, atualiza a lista e não altera o endereço da conversa', async () => {
  renomear.mockResolvedValue({ titulo: 'Projeto Nina' });
  render(<ListaConversas threads={[thread]} dono={dono} />);
  fireEvent.click(screen.getByRole('button', { name: /Renomear Clínica/ }));
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Projeto Nina' } });
  fireEvent.submit(screen.getByRole('form'));
  await screen.findByText('Nome salvo.');
  expect(renomear).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('link', { name: /Projeto Nina/ })).toHaveAttribute(
    'href',
    `/consultor/${thread.id}`,
  );
});
it('Escape cancela edição sem fechar histórico e depois devolve foco ao gatilho', async () => {
  render(
    <HistoricoDropdown total={1} rotulo="Conversas">
      <ListaConversas threads={[thread]} dono={dono} />
    </HistoricoDropdown>,
  );
  const abrir = screen.getByRole('button', { name: /Conversas/ });
  fireEvent.click(abrir);
  fireEvent.click(screen.getByRole('button', { name: /Renomear Clínica/ }));
  fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
  expect(screen.getByRole('searchbox')).toBeVisible();
  await waitFor(() =>
    expect(screen.getByRole('button', { name: /Renomear Clínica/ })).toHaveFocus(),
  );
  fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
  expect(abrir).toHaveFocus();
  expect(renomear).not.toHaveBeenCalled();
});
it('não exibe uma resposta atrasada de outra busca', async () => {
  let resolver!: (resposta: Response) => void;
  vi.spyOn(globalThis, 'fetch')
    .mockImplementationOnce(
      () =>
        new Promise((r) => {
          resolver = r;
        }),
    )
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          threads: [{ ...thread, titulo: 'Novo resultado' }],
          total: 1,
          mais: false,
        }),
      ),
    );
  render(<ListaConversas threads={[thread]} dono={dono} />);
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'antigo' } });
  await waitFor(() => expect(resolver).toBeDefined());
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'novo' } });
  await screen.findByText('Novo resultado');
  resolver(
    new Response(
      JSON.stringify({
        threads: [{ ...thread, titulo: 'Resultado errado' }],
        total: 1,
        mais: false,
      }),
    ),
  );
  await waitFor(() =>
    expect(within(screen.getByRole('list')).queryByText('Resultado errado')).toBeNull(),
  );
});
