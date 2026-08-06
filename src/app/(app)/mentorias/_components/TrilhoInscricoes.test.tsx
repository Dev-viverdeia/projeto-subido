import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SessaoMentoria } from '@/lib/mentorias/tipos';
import { TrilhoInscricoes } from './TrilhoInscricoes';

/**
 * O trilho é a única parte da tela que fala do que é SEU, e ele se apoia num
 * campo que vem do servidor por linha via RLS (`euInscrito`). Duas coisas
 * precisam ficar presas:
 *
 * 1. Ele SOME quando não há check-in. Um card "suas inscrições: 0" em toda visita
 *    de quem nunca marcou nada é ruído com aparência de informação.
 * 2. Ele conta `euInscrito`, e só. Se algum dia alguém trocar isso por um estado
 *    de tela, o número volta a ser opinião do cliente sobre o banco.
 */
function sessao(id: string, titulo: string, euInscrito: boolean): SessaoMentoria {
  return {
    id,
    titulo,
    descricao: '',
    inicioIso: '2026-08-10T19:00:00.000Z',
    fimIso: '2026-08-10T20:30:00.000Z',
    vagas: 30,
    salaUrl: null,
    mentor: {
      id: 'p1',
      nome: 'Equipe Subido',
      headline: '',
      foto_url: null,
      trilha: 'implementacao',
    },
    inscritos: 5,
    euInscrito,
  };
}

const AGORA = new Date('2026-08-10T10:00:00.000Z');

describe('trilho de inscrições', () => {
  it('não renderiza nada quando não há check-in', () => {
    const { container } = render(
      <TrilhoInscricoes
        sessoes={[sessao('a', 'Uma', false), sessao('b', 'Outra', false)]}
        agora={AGORA}
        aoAbrirDetalhe={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('lista só as sessões em que a pessoa fez check-in', () => {
    render(
      <TrilhoInscricoes
        sessoes={[
          sessao('a', 'Sessão marcada', true),
          sessao('b', 'Sessão de outra pessoa', false),
          sessao('c', 'Outra marcada', true),
        ]}
        agora={AGORA}
        aoAbrirDetalhe={vi.fn()}
      />,
    );

    const card = screen.getByRole('region', { name: 'Suas inscrições' });
    expect(within(card).getByText('Sessão marcada')).toBeDefined();
    expect(within(card).getByText('Outra marcada')).toBeDefined();
    expect(within(card).queryByText('Sessão de outra pessoa')).toBeNull();
    /* A contagem é derivada da mesma filtragem, não um número à parte. */
    expect(within(card).getByText('2')).toBeDefined();
  });

  it('cada linha abre a ficha da própria sessão', async () => {
    const user = userEvent.setup();
    const abrir = vi.fn();
    render(
      <TrilhoInscricoes
        sessoes={[sessao('a', 'Sessão marcada', true)]}
        agora={AGORA}
        aoAbrirDetalhe={abrir}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Sessão marcada/ }));
    expect(abrir).toHaveBeenCalledWith('a');
  });
});
