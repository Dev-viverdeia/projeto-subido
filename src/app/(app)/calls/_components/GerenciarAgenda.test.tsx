import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ReuniaoCall } from '@/lib/calls/reuniao-modelo';
const { alterar, refresh } = vi.hoisted(() => ({ alterar: vi.fn(), refresh: vi.fn() }));
vi.mock('@/lib/calls/agenda-actions', () => ({ alterarAgendaReuniao: alterar }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));
import { GerenciarAgenda } from './GerenciarAgenda';
const reuniao: ReuniaoCall = {
  id: '11111111-1111-4111-8111-111111111111',
  titulo: 'Descoberta com Nina',
  empresa: 'Nina',
  contato: 'Marina',
  tipo: 'descoberta',
  status: 'agendada',
  agendadaPara: '2099-10-10T15:00:00.000Z',
  duracaoMinutos: 45,
  codigoPublico: 'sala-teste',
  liveCoachAtivo: true,
  oportunidadeId: 'oportunidade',
  oportunidade: 'Projeto Nina',
  convidadoEmail: 'marina@example.com',
  googleSyncStatus: 'sincronizado',
  googleEventUrl: null,
  googleSyncErro: null,
  criadaEm: '2026-09-05T12:00:00.000Z',
  atualizadaEm: '2026-09-05T12:00:00.000Z',
};
beforeEach(() => {
  alterar.mockReset();
  refresh.mockClear();
});
describe('GerenciarAgenda', () => {
  it('abre na camada global com o horário atual e sem cancelar ao abrir', async () => {
    render(<GerenciarAgenda reuniao={reuniao} />);
    await userEvent.click(screen.getByRole('button', { name: 'Alterar reunião' }));
    const dialogo = screen.getByRole('dialog', { name: 'Alterar reunião' });
    expect(dialogo.parentElement?.parentElement?.parentElement).toBe(document.body);
    expect(screen.getByLabelText('Duração (minutos)')).toHaveValue(45);
    expect(within(dialogo).getByRole('button', { name: 'Salvar novo horário' })).toBeVisible();
    expect(alterar).not.toHaveBeenCalled();
  });
  it('exige confirmação para cancelar e só fecha por decisão do usuário', async () => {
    alterar.mockResolvedValue({ status: 'concluido' });
    render(<GerenciarAgenda reuniao={reuniao} abertoInicial />);
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar reunião' }));
    const dialogo = screen.getByRole('dialog', { name: 'Cancelar esta reunião?' });
    expect(alterar).not.toHaveBeenCalled();
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar reunião' }));
    await waitFor(() => expect(alterar).toHaveBeenCalledOnce());
    const form = alterar.mock.calls[0]![1] as FormData;
    expect(form.get('acao')).toBe('cancelar');
    expect(form.get('versao')).toBe(reuniao.atualizadaEm);
    expect(await screen.findByText('Reunião cancelada')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Fechar' })).toBeVisible();
    expect(refresh).toHaveBeenCalledOnce();
  });
  it('mantém o resultado parcial visível com recuperação sem prometer sucesso', async () => {
    alterar.mockResolvedValue({
      status: 'pendente',
      mensagem: 'Falta atualizar o convite no Google.',
      reconectar: true,
    });
    render(<GerenciarAgenda reuniao={reuniao} abertoInicial />);
    await userEvent.click(screen.getByRole('button', { name: 'Salvar novo horário' }));
    expect(await screen.findByText('Falta atualizar o convite no Google.')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Reconectar agenda' })).toHaveAttribute(
      'href',
      expect.stringContaining('/conectar?retorno='),
    );
    expect(screen.queryByText('Horário atualizado')).not.toBeInTheDocument();
  });
  it('não oferece alteração para reunião iniciada', () => {
    render(<GerenciarAgenda reuniao={{ ...reuniao, status: 'ao_vivo' }} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
