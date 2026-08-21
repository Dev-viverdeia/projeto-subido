import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JornadaOperacional } from '@/lib/jornada/queries';

const { obterConversaRecente } = vi.hoisted(() => ({ obterConversaRecente: vi.fn() }));

vi.mock('@/lib/consultor/queries', () => ({ obterConversaRecente }));
vi.mock('../../consultor/_components/Conversa', () => ({
  Conversa: () => <div>Compositor</div>,
}));
vi.mock('../../consultor/_components/Mensagens', () => ({
  Mensagens: () => <div>Histórico</div>,
}));

import { SobralChatInicio, SobralChatVisual } from './SobralChatInicio';

describe('SobralChatInicio', () => {
  beforeEach(() => {
    obterConversaRecente.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('isola uma falha do histórico sem derrubar a Início', async () => {
    obterConversaRecente.mockRejectedValueOnce(new Error('falha temporária'));

    render(await SobralChatInicio({ jornada: {} as JornadaOperacional }));

    expect(screen.getByRole('alert')).toHaveTextContent('O chat não carregou desta vez.');
    expect(screen.getByRole('link', { name: /Tentar novamente/ })).toHaveAttribute(
      'href',
      '/inicio#sobral-ai',
    );
  });

  it('oferece uma versão completa sem criar outro chat', () => {
    render(
      <SobralChatVisual
        completo
        mensagens={[]}
        exemplos={[]}
        acaoCabecalho={<button type="button">Conversas</button>}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'O que você precisa resolver agora?' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Conversas' })).toBeVisible();
    expect(screen.getByText('Seu contexto já está conectado')).toBeVisible();
  });
});
