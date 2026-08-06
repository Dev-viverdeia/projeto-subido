import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { PainelEspera } from './PainelEspera';

/**
 * A NARRAÇÃO É HONESTA POR CONSTRUÇÃO, e é isso que este teste prende.
 *
 * Os passos descrevem as fases de UMA chamada — o modelo está mesmo lendo,
 * mapeando e escrevendo. O que não pode acontecer é um check afirmar um término
 * que ninguém verificou: por isso o ÚLTIMO passo nunca ganha check sozinho. Ele
 * fica ativo até o sinal real (a resposta da análise, ou o status virando
 * `pronta` no banco) tirar o painel da tela.
 *
 * Sem essa trava, a lista completaria os três em 2 minutos e ficaria mostrando
 * "tudo pronto" enquanto a geração ainda roda — que é exatamente a mentira que a
 * narração precisa não contar.
 */
const PASSOS = ['Lendo', 'Mapeando', 'Escrevendo'];

function montar(falha?: React.ReactNode) {
  return render(
    <PainelEspera
      rotulo="Análise"
      ideia="Um vendedor no WhatsApp"
      passos={PASSOS}
      intervalo={1000}
      falha={falha}
    />,
  );
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

/**
 * Avança o relógio de mentira UM CICLO POR VEZ.
 *
 * Um `advanceTimersByTime(600000)` só faria disparar o timer que já estava
 * pendente: o próximo é agendado pelo efeito, que só roda depois do re-render do
 * React. Pular esse detalhe fazia o teste medir dois passos onde tinha pedido
 * dez minutos — e a primeira versão dele reprovou por isso, não por defeito do
 * componente.
 */
function avancarCiclos(quantos: number, intervalo = 1000) {
  for (let i = 0; i < quantos; i += 1) {
    act(() => {
      vi.advanceTimersByTime(intervalo);
    });
  }
}

describe('painel de espera', () => {
  it('começa no primeiro passo, com o contador na posição', () => {
    montar();
    expect(screen.getByText('01 / 03')).toBeDefined();
    expect(screen.getByText('Lendo').closest('li')).toHaveProperty('dataset.ativo', '');
  });

  it('avança os passos intermediários e marca os anteriores', () => {
    montar();
    avancarCiclos(1);

    expect(screen.getByText('Lendo').closest('li')).toHaveProperty('dataset.feito', '');
    expect(screen.getByText('Mapeando').closest('li')).toHaveProperty('dataset.ativo', '');
    expect(screen.getByText('02 / 03')).toBeDefined();
  });

  /* O CORAÇÃO DO TESTE: por mais que o tempo passe, o último não completa. */
  it('para no último passo e nunca o marca como feito', () => {
    montar();
    avancarCiclos(20);

    /* Lê o valor em vez de `toHaveProperty(path, undefined)`: o matcher exige
       que a CHAVE exista, e a ausência do atributo é justamente o que se afirma
       aqui. A primeira versão reprovou por isso. */
    const ultimo = screen.getByText('Escrevendo').closest('li') as HTMLElement;
    expect(ultimo.dataset.ativo).toBe('');
    expect(ultimo.dataset.feito).toBeUndefined();
    /* O contador trava em 03/03 — a fase é a terceira, mas nada afirma término. */
    expect(screen.getByText('03 / 03')).toBeDefined();
  });

  /* Nenhum passo exibe tempo medido: "✓ 30s" afirmaria uma medição que não
     existe, e é essa a diferença entre narrar e inventar. */
  it('não exibe tempo em passo nenhum', () => {
    montar();
    avancarCiclos(20);
    expect(screen.queryByText(/\d+\s*s\b/)).toBeNull();
  });

  it('a falha substitui a lista inteira', () => {
    montar(<p>A geração não respondeu</p>);
    expect(screen.getByText('A geração não respondeu')).toBeDefined();
    expect(screen.queryByText('Lendo')).toBeNull();
  });

  it('com falha, o relógio para de avançar', () => {
    montar(<p>Parou</p>);
    avancarCiclos(20);
    expect(screen.getByText('01 / 03')).toBeDefined();
  });
});
