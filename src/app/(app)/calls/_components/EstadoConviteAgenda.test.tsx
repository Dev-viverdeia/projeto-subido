import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import type { ReuniaoCall } from '@/lib/calls/reuniao-modelo';
const { alterar, refresh } = vi.hoisted(() => ({ alterar: vi.fn(), refresh: vi.fn() }));
vi.mock('@/lib/calls/agenda-actions', () => ({ alterarAgendaReuniao: alterar }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));
import { EstadoConviteAgenda } from './EstadoConviteAgenda';
const reuniao = {
  id: '11111111-1111-4111-8111-111111111111',
  status: 'cancelada',
  googleSyncStatus: 'falhou',
  googleSyncErro: 'Reconecte sua agenda para atualizar o convite.',
} as ReuniaoCall;
it('mantém recuperação disponível em reunião cancelada, inclusive após reconectar', async () => {
  alterar.mockResolvedValue({ status: 'concluido' });
  render(<EstadoConviteAgenda reuniao={reuniao} />);
  expect(screen.getByRole('link', { name: 'Reconectar agenda' })).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Atualizar convite' }));
  await waitFor(() => expect(alterar).toHaveBeenCalledOnce());
  expect((alterar.mock.calls[0]![1] as FormData).get('acao')).toBe('sincronizar');
  expect(await screen.findByText('Agenda atualizada')).toBeVisible();
  expect(screen.queryByText(reuniao.googleSyncErro!)).not.toBeInTheDocument();
});
it('não mostra aviso em convite sincronizado', () => {
  const { container } = render(
    <EstadoConviteAgenda reuniao={{ ...reuniao, googleSyncStatus: 'sincronizado' }} />,
  );
  expect(container).toBeEmptyDOMElement();
});
