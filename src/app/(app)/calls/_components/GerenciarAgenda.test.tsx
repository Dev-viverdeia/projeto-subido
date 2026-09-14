import { fireEvent, render, screen, within, waitFor } from '@testing-library/react';
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
  it('mostra o conflito sem perder a edição e só envia confirmação após escolha explícita', async () => {
    const conflito = {
      inicio: reuniao.agendadaPara,
      duracao: 45,
      total: 1,
      confirmacao: 'assinatura',
      reunioes: [
        { id: 'outra', titulo: 'Kickoff Aurora', inicio: reuniao.agendadaPara, duracao: 60 },
      ],
    };
    alterar.mockResolvedValue({ status: 'erro', conflito });
    render(<GerenciarAgenda reuniao={reuniao} abertoInicial />);
    await userEvent.click(screen.getByRole('button', { name: 'Salvar novo horário' }));
    const aviso = await screen.findByRole('region', {
      name: 'Você já tem uma reunião neste horário',
    });
    await waitFor(() => expect(aviso).toHaveFocus());
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.getByText('Kickoff Aurora')).toBeVisible();
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect((alterar.mock.calls[0]![1] as FormData).get('confirmacaoHorario')).toBeNull();
    await userEvent.click(screen.getByRole('checkbox'));
    alterar.mockResolvedValue({ status: 'concluido' });
    await userEvent.click(screen.getByRole('button', { name: 'Salvar novo horário' }));
    await screen.findByText('Horário atualizado');
    expect((alterar.mock.calls[1]![1] as FormData).get('confirmacaoHorario')).toBe('assinatura');
  });

  it('descarta o aceite ao trocar duração, mesmo voltando ao horário anterior', async () => {
    alterar.mockResolvedValue({
      status: 'erro',
      conflito: {
        inicio: reuniao.agendadaPara,
        duracao: 45,
        total: 1,
        confirmacao: 'assinatura',
        reunioes: [],
      },
    });
    render(<GerenciarAgenda reuniao={reuniao} abertoInicial />);
    await userEvent.click(screen.getByRole('button', { name: 'Salvar novo horário' }));
    await userEvent.click(await screen.findByRole('checkbox'));
    fireEvent.change(screen.getByLabelText('Duração (minutos)'), { target: { value: '60' } });
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Duração (minutos)'), { target: { value: '45' } });
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar reunião' }));
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
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
