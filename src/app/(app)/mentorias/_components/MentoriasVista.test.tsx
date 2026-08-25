import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { cancelarCheckin, fazerCheckin } from '@/lib/mentorias/actions';
import type { SessaoMentoria } from '@/lib/mentorias/tipos';
import { MentoriasVista } from './MentoriasVista';

vi.mock('@/lib/mentorias/actions', () => ({
  cancelarCheckin: vi.fn(() => Promise.resolve({ ok: true, saldo: 21, creditos: 1 })),
  fazerCheckin: vi.fn(() => Promise.resolve({ ok: true, saldo: 19, creditos: 1 })),
}));

const SESSAO: SessaoMentoria = {
  id: 'mentoria-inscrita',
  titulo: 'Clínica de proposta comercial',
  descricao: 'Uma sessão prática.',
  inicioIso: '2026-08-18T19:00:00.000Z',
  fimIso: '2026-08-18T20:00:00.000Z',
  vagas: 30,
  custoCreditos: 1,
  salaUrl: null,
  inscritos: 8,
  euInscrito: true,
  mentor: {
    id: 'mentor-1',
    nome: 'Equipe Subido',
    headline: 'Implementação em campo',
    foto_url: null,
    trilha: 'implementacao',
  },
};

describe('ações de check-in nas mentorias', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cancelarCheckin).mockResolvedValue({ ok: true, saldo: 21, creditos: 1 });
    vi.mocked(fazerCheckin).mockResolvedValue({ ok: true, saldo: 19, creditos: 1 });
  });

  it('explica a consequência antes de cancelar uma vaga', async () => {
    const user = userEvent.setup();
    render(
      <MentoriasVista
        sessoes={[SESSAO]}
        agoraIso="2026-08-18T10:00:00.000Z"
        vistaInicial="agenda"
        saldoInicial={20}
      />,
    );

    await user.click(screen.getAllByRole('button', { name: /Cancelar check-in/ })[0]!);

    const dialogo = screen.getByRole('dialog', { name: 'Cancelar seu check-in?' });
    expect(within(dialogo).getByText(/Sua vaga.+volta a ficar disponível/)).toBeDefined();
    expect(within(dialogo).getByRole('button', { name: 'Manter check-in' })).toBeDefined();

    await user.click(within(dialogo).getByRole('button', { name: 'Cancelar check-in' }));
    await waitFor(() => expect(cancelarCheckin).toHaveBeenCalledWith(SESSAO.id));
    expect(await screen.findByRole('dialog', { name: 'Check-in cancelado' })).toBeInTheDocument();
  });

  it('mantém o usuário informado enquanto reserva a vaga e conclui no mesmo diálogo', async () => {
    const user = userEvent.setup();
    let concluir!: (resultado: { ok: true; saldo: number; creditos: number }) => void;
    vi.mocked(fazerCheckin).mockImplementationOnce(
      () => new Promise((resolve) => (concluir = resolve)),
    );

    render(
      <MentoriasVista
        sessoes={[{ ...SESSAO, id: 'mentoria-aberta', euInscrito: false }]}
        agoraIso="2026-08-18T10:00:00.000Z"
        vistaInicial="agenda"
        saldoInicial={20}
      />,
    );

    await user.click(screen.getAllByRole('button', { name: /Fazer check-in/ })[0]!);
    const confirmacao = screen.getByRole('dialog', { name: 'Confirmar check-in' });
    expect(within(confirmacao).getByText('19')).toBeInTheDocument();

    await user.click(within(confirmacao).getByRole('button', { name: 'Confirmar por 1 crédito' }));
    expect(
      await screen.findByRole('dialog', { name: 'Confirmando seu check-in' }),
    ).toHaveTextContent('Reservando sua vaga');

    await act(async () => {
      concluir({ ok: true, saldo: 19, creditos: 1 });
      await Promise.resolve();
    });

    expect(await screen.findByRole('dialog', { name: 'Check-in confirmado' })).toHaveTextContent(
      'A sala aparece aqui quando a sessão começar',
    );
  });

  it('explica a falta de saldo antes de tentar reservar a vaga', async () => {
    const user = userEvent.setup();
    render(
      <MentoriasVista
        sessoes={[{ ...SESSAO, id: 'mentoria-sem-saldo', euInscrito: false }]}
        agoraIso="2026-08-18T10:00:00.000Z"
        vistaInicial="agenda"
        saldoInicial={0}
      />,
    );

    await user.click(screen.getAllByRole('button', { name: /Fazer check-in/ })[0]!);

    const dialogo = screen.getByRole('dialog', { name: 'Confirmar check-in' });
    expect(within(dialogo).getByText('Faltam créditos para este check-in')).toBeInTheDocument();
    expect(within(dialogo).getByRole('link', { name: 'Ver meus créditos' })).toHaveAttribute(
      'href',
      '/conta/creditos',
    );
    expect(
      within(dialogo).queryByRole('button', { name: 'Confirmar por 1 crédito' }),
    ).not.toBeInTheDocument();
    expect(fazerCheckin).not.toHaveBeenCalled();
  });
});
