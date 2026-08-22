import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SessaoMentoria } from '@/lib/mentorias/tipos';
import { ItemAgenda } from './ItemAgenda';

/**
 * O QUE ESTE TESTE PRENDE: o check-in por TECLADO.
 *
 * A linha era um `<article role="button" tabIndex={0}>` com botões dentro. O
 * `onKeyDown` do artigo recebe os eventos que sobem dos filhos, então apertar
 * Espaço em "Fazer check-in" rodava `preventDefault()` e abria a ficha — o botão
 * nunca era acionado. Quem navega por teclado não conseguia fazer check-in, e o
 * que via era um modal abrindo sem explicação. O `stopPropagation` que existia
 * nos `onClick` protegia o mouse e só o mouse, que é por que ninguém percebeu.
 *
 * Nada em tsc, eslint ou build enxerga isso.
 */
const SESSAO: SessaoMentoria = {
  id: 'm1',
  titulo: 'Implantação de agentes',
  descricao: 'Uma sessão.',
  inicioIso: '2026-08-10T19:00:00.000Z',
  fimIso: '2026-08-10T20:30:00.000Z',
  vagas: 30,
  custoCreditos: 1,
  salaUrl: null,
  mentor: {
    id: 'p1',
    nome: 'Equipe Subido',
    headline: 'Encontro semanal',
    foto_url: null,
    trilha: 'implementacao',
  },
  inscritos: 12,
  euInscrito: false,
};

const AGORA = new Date('2026-08-10T10:00:00.000Z');

function montar(props: Partial<Parameters<typeof ItemAgenda>[0]> = {}) {
  const espioes = {
    abrir: vi.fn(),
    checkin: vi.fn(),
    cancelar: vi.fn(),
  };
  render(
    <ItemAgenda
      sessao={SESSAO}
      estado="checkin-aberto"
      agora={AGORA}
      gravando={false}
      aoAbrirDetalhe={espioes.abrir}
      aoFazerCheckin={espioes.checkin}
      aoCancelarCheckin={espioes.cancelar}
      {...props}
    />,
  );
  return espioes;
}

describe('linha da agenda', () => {
  it('ESPAÇO no botão de check-in faz check-in, e não abre a ficha', async () => {
    const user = userEvent.setup();
    const espioes = montar();

    await user.tab();
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /Fazer check-in/ }));

    await user.keyboard('{ }');

    expect(espioes.checkin).toHaveBeenCalledTimes(1);
    expect(espioes.abrir).not.toHaveBeenCalled();
  });

  it('ENTER no botão de check-in faz check-in, e não abre a ficha', async () => {
    const user = userEvent.setup();
    const espioes = montar();

    await user.tab();
    await user.tab();
    await user.keyboard('{Enter}');

    expect(espioes.checkin).toHaveBeenCalledTimes(1);
    expect(espioes.abrir).not.toHaveBeenCalled();
  });

  /* A sobreposição precisa continuar dando o clique de linha inteira — era o que
     o `role="button"` no artigo entregava, e a correção não pode custar isso. */
  it('o título abre a ficha, e é ele o primeiro na ordem de foco', async () => {
    const user = userEvent.setup();
    const espioes = montar();

    await user.tab();
    const titulo = screen.getByRole('button', { name: SESSAO.titulo });
    expect(document.activeElement).toBe(titulo);

    await user.keyboard('{Enter}');
    expect(espioes.abrir).toHaveBeenCalledTimes(1);
    expect(espioes.checkin).not.toHaveBeenCalled();
  });

  /* Um `role="button"` no artigo faria o nome acessível ser a soma de tudo que a
     linha mostra: hora, duração, título, mentor, contagem e o rótulo do CTA. */
  it('não existe mais controle interativo aninhado', () => {
    montar();
    const botoes = screen.getAllByRole('button');
    for (const b of botoes) {
      expect(b.querySelector('button')).toBeNull();
    }
  });

  it('separa o estado confirmado da ação de cancelar', async () => {
    const user = userEvent.setup();
    const espioes = montar({ estado: 'inscrito' });
    const botao = screen.getByRole('button', { name: /Cancelar check-in/ });
    expect(botao.textContent).toContain('Cancelar check-in');
    expect(screen.getByText('Check-in confirmado').closest('button')).toBeNull();

    await user.click(botao);
    expect(espioes.cancelar).toHaveBeenCalledTimes(1);
  });

  it('com gravação em voo os CTAs ficam travados', () => {
    montar({ gravando: true });
    expect(screen.getByRole('button', { name: /Fazer check-in/ })).toHaveProperty('disabled', true);
  });
});
