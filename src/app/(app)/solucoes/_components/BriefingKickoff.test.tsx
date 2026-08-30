import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { BriefingKickoff as DadosBriefing } from '@/lib/projetos-execucao/briefing';

vi.mock('@/lib/projetos-execucao/briefing-actions', () => ({
  salvarBriefingKickoff: vi.fn(),
}));

import { BriefingKickoff } from './BriefingKickoff';

const BRIEFING: DadosBriefing = {
  objetivo: 'Responder novos contatos rapidamente.',
  criterioSucesso: '90% das conversas respondidas em um minuto.',
  responsavelCliente: 'Camila Rios',
  responsavelTecnico: 'Mateus Silva',
  acessos: ['WhatsApp Business'],
  limites: ['Dúvidas clínicas seguem para a recepção'],
  proximosPassos: ['Liberar os acessos combinados'],
  observacoes: '',
  confirmadoEm: null,
  fonteCallId: null,
};

describe('BriefingKickoff', () => {
  it('mostra uma parte do acordo por vez e preserva os dados do kickoff', async () => {
    const user = userEvent.setup();
    render(
      <BriefingKickoff
        projetoId="11111111-1111-4111-8111-111111111111"
        briefing={BRIEFING}
        origem="kickoff"
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Confirme como a entrega vai acontecer' }),
    ).toBeVisible();
    expect(screen.getByRole('tabpanel', { name: 'Resultado esperado' })).toBeVisible();
    expect(document.getElementById('briefing-responsaveis')).not.toHaveAttribute('data-visivel');

    await user.click(screen.getByRole('tab', { name: /Responsáveis/i }));
    expect(document.getElementById('briefing-responsaveis')).toHaveAttribute('data-visivel');
    expect(screen.getByRole('textbox', { name: 'Responsável do cliente' })).toHaveValue(
      'Camila Rios',
    );

    await user.click(screen.getByRole('tab', { name: /Acessos e limites/i }));
    expect(screen.getByText(/Senhas, tokens e chaves nunca devem ser salvos/i)).toBeVisible();
  });
});
