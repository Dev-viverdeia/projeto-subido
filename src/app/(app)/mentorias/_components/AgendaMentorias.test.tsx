import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SessaoMentoria } from '@/lib/mentorias/tipos';
import { AgendaMentorias } from './AgendaMentorias';
import { estadoDe } from './estadoMentoria';

/**
 * O QUE ESTE TESTE PRENDE: a contagem da aba e a lista falam do MESMO fato.
 *
 * As duas saem do mesmo predicado de propósito. Escrever a contagem como um
 * segundo `filter` — o caminho curto — daria dois lugares para a mesma pergunta,
 * e eles divergiriam no primeiro ajuste de borda ("esta semana" inclui hoje?). A
 * aba diria 3 e a lista mostraria 2, e nada em tsc, eslint ou build perceberia.
 */
const AGORA = new Date('2026-08-10T15:00:00.000Z');

function sessao(id: string, offsetDias: number): SessaoMentoria {
  const inicio = new Date(AGORA.getTime() + offsetDias * 86_400_000);
  inicio.setUTCHours(19, 0, 0, 0);
  return {
    id,
    titulo: `Sessão ${id}`,
    descricao: '',
    inicioIso: inicio.toISOString(),
    fimIso: new Date(inicio.getTime() + 5_400_000).toISOString(),
    vagas: 30,
    custoCreditos: 1,
    salaUrl: null,
    mentor: {
      id: 'p1',
      nome: 'Equipe Subido',
      headline: '',
      foto_url: null,
      trilha: 'implementacao',
    },
    inscritos: 3,
    euInscrito: false,
  };
}

/* hoje · amanhã · daqui a 3 dias · daqui a 20 dias */
const SESSOES = [sessao('a', 0), sessao('b', 1), sessao('c', 3), sessao('d', 20)];

function montar() {
  return render(
    <AgendaMentorias
      sessoes={SESSOES}
      agora={AGORA}
      agoraIso={AGORA.toISOString()}
      estadoDaSessao={(s) => estadoDe(s, AGORA, s.euInscrito)}
      gravando={false}
      aoAbrirDetalhe={vi.fn()}
      aoFazerCheckin={vi.fn()}
      aoCancelarCheckin={vi.fn()}
    />,
  );
}

beforeEach(() => {
  if (!('matchMedia' in window)) {
    Reflect.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
      writable: true,
    });
  }
});

describe('agenda por dia', () => {
  it.each([
    ['Hoje', 1],
    ['Amanhã', 1],
    ['Esta semana', 3],
    ['Todas', 4],
  ])('a aba "%s" anuncia %i e a lista mostra o mesmo', async (rotulo, esperado) => {
    const user = userEvent.setup();
    const { container } = montar();

    /* O nome acessível é composto à mão ("Hoje, 1") justamente porque a
       concatenação automática sairia "Hoje1". É por ele que buscamos. */
    const aba = screen.getByRole('tab', { name: `${rotulo}, ${esperado}` });
    await user.click(aba);

    expect(container.querySelectorAll('article')).toHaveLength(esperado);
  });

  /* "Hoje" só é o padrão se HOUVER hoje — abrir num filtro vazio é a forma mais
     rápida de a tela parecer quebrada. */
  it('sem sessão hoje, abre em "Todas"', () => {
    render(
      <AgendaMentorias
        sessoes={[sessao('x', 5)]}
        agora={AGORA}
        agoraIso={AGORA.toISOString()}
        estadoDaSessao={(s) => estadoDe(s, AGORA, s.euInscrito)}
        gravando={false}
        aoAbrirDetalhe={vi.fn()}
        aoFazerCheckin={vi.fn()}
        aoCancelarCheckin={vi.fn()}
      />,
    );

    expect(screen.getByRole('tab', { name: 'Todas, 1' }).getAttribute('aria-selected')).toBe(
      'true',
    );
    expect(screen.getByRole('tab', { name: 'Hoje, 0' }).getAttribute('aria-selected')).toBe(
      'false',
    );
  });

  it('explica o filtro vazio e permite voltar para a agenda completa', async () => {
    const user = userEvent.setup();
    render(
      <AgendaMentorias
        sessoes={[sessao('x', 5)]}
        agora={AGORA}
        agoraIso={AGORA.toISOString()}
        estadoDaSessao={(s) => estadoDe(s, AGORA, s.euInscrito)}
        gravando={false}
        aoAbrirDetalhe={vi.fn()}
        aoFazerCheckin={vi.fn()}
        aoCancelarCheckin={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('tab', { name: 'Hoje, 0' }));

    expect(screen.getByText('Hoje está livre na agenda.')).toBeDefined();
    await user.click(screen.getByRole('button', { name: 'Ver agenda completa' }));

    expect(screen.getByRole('tab', { name: 'Todas, 1' }).getAttribute('aria-selected')).toBe(
      'true',
    );
    expect(screen.getByText('Sessão x')).toBeDefined();
  });
});
