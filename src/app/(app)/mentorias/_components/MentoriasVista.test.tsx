import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { cancelarCheckin } from '@/lib/mentorias/actions';
import type { SessaoMentoria } from '@/lib/mentorias/tipos';
import { MentoriasVista } from './MentoriasVista';

vi.mock('@/lib/mentorias/actions', () => ({
  cancelarCheckin: vi.fn(() => Promise.resolve({ ok: true })),
  fazerCheckin: vi.fn(() => Promise.resolve({ ok: true })),
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
  it('explica a consequência antes de cancelar uma vaga', async () => {
    const user = userEvent.setup();
    render(
      <MentoriasVista
        sessoes={[SESSAO]}
        agoraIso="2026-08-18T10:00:00.000Z"
        vistaInicial="agenda"
      />,
    );

    await user.click(screen.getAllByRole('button', { name: /Cancelar check-in/ })[0]!);

    const dialogo = screen.getByRole('dialog', { name: 'Cancelar seu check-in?' });
    expect(within(dialogo).getByText(/Sua vaga.+volta a ficar disponível/)).toBeDefined();
    expect(within(dialogo).getByRole('button', { name: 'Manter check-in' })).toBeDefined();

    await user.click(within(dialogo).getByRole('button', { name: 'Cancelar check-in' }));
    await waitFor(() => expect(cancelarCheckin).toHaveBeenCalledWith(SESSAO.id));
  });
});
