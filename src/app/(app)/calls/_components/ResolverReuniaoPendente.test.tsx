import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/calls/actions', () => ({ resolverReuniaoPendente: vi.fn() }));

import { ResolverReuniaoPendente } from './ResolverReuniaoPendente';

describe('ResolverReuniaoPendente', () => {
  it('abre a confirmação na camada global sem ficar presa ao card', async () => {
    const user = userEvent.setup();
    render(<ResolverReuniaoPendente reuniaoId="11111111-1111-4111-8111-111111111111" />);

    await user.click(screen.getByRole('button', { name: 'Resolver pendência' }));

    const dialogo = screen.getByRole('dialog', { name: 'Resolver reunião pendente' });
    expect(dialogo.parentElement?.parentElement?.parentElement).toBe(document.body);
    expect(screen.getByRole('button', { name: 'Marcar como não realizada' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Escolher novo horário' })).toBeInTheDocument();
  });
});
