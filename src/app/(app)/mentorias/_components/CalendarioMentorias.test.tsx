import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SessaoMentoria } from '@/lib/mentorias/tipos';
import { CalendarioMentorias } from './CalendarioMentorias';
import { estadoDe } from './estadoMentoria';

/**
 * O QUE ESTE TESTE PRENDE: clicar na SESSÃO abre a sessão.
 *
 * A célula do mês era um `<button>` com os chips das sessões dentro — controle
 * interativo aninhado, que o HTML não permite. O efeito prático não era teórico:
 * clicar num chip selecionava o DIA e nunca abria a ficha, porque o clique subia
 * para o botão da célula. Por teclado nem isso, já que os chips não eram
 * focáveis. É o mesmo defeito que a linha da agenda tinha, e a correção é a
 * mesma: sobreposição no seletor de dia, chips por cima com clique próprio.
 */
const AGORA = new Date('2026-08-10T15:00:00.000Z');

function sessao(id: string, offsetDias: number, titulo: string): SessaoMentoria {
  const inicio = new Date(AGORA.getTime() + offsetDias * 86_400_000);
  inicio.setUTCHours(19, 0, 0, 0);
  return {
    id,
    titulo,
    descricao: '',
    inicioIso: inicio.toISOString(),
    fimIso: new Date(inicio.getTime() + 5_400_000).toISOString(),
    vagas: 30,
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

const SESSOES = [sessao('a', 2, 'Plantão de implantação'), sessao('b', 4, 'Clínica de preço')];

function montar() {
  const abrir = vi.fn();
  render(
    <CalendarioMentorias
      sessoes={SESSOES}
      agora={AGORA}
      estadoDaSessao={(s) => estadoDe(s, AGORA, s.euInscrito)}
      aoAbrirDetalhe={abrir}
    />,
  );
  return abrir;
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

describe('calendário do mês', () => {
  it('clicar no chip da sessão abre a ficha, não seleciona o dia', async () => {
    const user = userEvent.setup();
    const abrir = montar();

    /* O chip aparece na célula do mês E na coluna do dia selecionado; o da
       célula é o que este teste cobre, e é o que estava quebrado. */
    const chips = screen.getAllByRole('button', { name: /Plantão de implantação/ });
    await user.click(chips[0]!);

    expect(abrir).toHaveBeenCalledWith('a');
  });

  it('o chip é alcançável por teclado', async () => {
    const user = userEvent.setup();
    const abrir = montar();

    const chip = screen.getAllByRole('button', { name: /Clínica de preço/ })[0]!;
    chip.focus();
    await user.keyboard('{Enter}');

    expect(abrir).toHaveBeenCalledWith('b');
  });

  /* Um `<button>` dentro de `<button>` o navegador desaninha sozinho no parse, e
     o resultado é markup que não corresponde ao JSX — bugs impossíveis de ler. */
  it('não existe controle interativo aninhado', () => {
    montar();
    for (const b of screen.getAllByRole('button')) {
      expect(b.querySelector('button')).toBeNull();
    }
  });

  /* A pastilha mostrava hora + iniciais do mentor: com um time só, todo evento do
     mês virava "ES" e o calendário não dizia o que era nenhuma sessão. */
  it('a pastilha do mês mostra o título da sessão', () => {
    montar();
    expect(
      screen.getAllByRole('button', { name: /Plantão de implantação/ }).length,
    ).toBeGreaterThan(0);
  });

  it('o botão do dia anuncia quantas mentorias tem', () => {
    montar();
    expect(screen.getByRole('button', { name: /12 — 1 mentoria$/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /11 — sem mentoria$/ })).toBeDefined();
  });
});
