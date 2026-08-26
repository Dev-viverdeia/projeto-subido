import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { registrarTentativaContato } from '@/lib/prospeccao/actions';
import { LinkContatoProspeccao } from './LinkContatoProspeccao';

vi.mock('@/lib/prospeccao/actions', () => ({
  registrarTentativaContato: vi.fn(),
}));

describe('LinkContatoProspeccao', () => {
  it('abre o canal e registra a abordagem sem trocar a ação do usuário', async () => {
    vi.mocked(registrarTentativaContato).mockResolvedValue({ ok: true });

    render(
      <LinkContatoProspeccao
        lead="11111111-1111-4111-8111-111111111111"
        canal="whatsapp"
        href="#whatsapp"
      >
        WhatsApp
      </LinkContatoProspeccao>,
    );

    const link = screen.getByRole('link', { name: 'WhatsApp' });
    expect(link).toHaveAttribute('href', '#whatsapp');
    fireEvent.click(link);

    await waitFor(() =>
      expect(registrarTentativaContato).toHaveBeenCalledWith({
        lead: '11111111-1111-4111-8111-111111111111',
        canal: 'whatsapp',
      }),
    );
  });
});
