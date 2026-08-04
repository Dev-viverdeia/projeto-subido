import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { RetratoMentor } from './RetratoMentor';
import { fatia, hashDeterminista } from './hashDeterminista';

/**
 * Duas garantias, e a segunda é a que já falhou uma vez no pôster das formações.
 *
 * 1. Foto real quando existe; campo gerado quando não. Nunca uma silhueta.
 * 2. O campo é ESTÁVEL por nome e VISIVELMENTE diferente entre nomes parecidos.
 *
 * A segunda garantia precisa de um número, e a primeira versão deste teste não
 * tinha um: ela comparava três strings de `style` e exigia que fossem distintas.
 * Isso passa com QUALQUER hash — inclusive um quebrado —, porque dois campos que
 * diferem em 0,3% são strings diferentes e retratos idênticos aos olhos.
 * Verificado: o teste antigo passava igual com a avalanche do hash removida.
 *
 * O que importa para o produto é separação que o olho vê. Medido nos quatro nomes
 * reais, a menor separação máxima entre pares é ~28 pontos percentuais; o limite
 * de 15 abaixo dá margem e continua reprovando um gerador que colapse.
 */
function campo(nome: string): string {
  const { container } = render(<RetratoMentor nome={nome} />);
  return container.querySelector('span')?.getAttribute('style') ?? '';
}

describe('retrato do mentor', () => {
  it('usa a foto quando ela existe', () => {
    const { container } = render(
      <RetratoMentor nome="Equipe Subido" fotoUrl="https://exemplo.test/f.jpg" />,
    );
    const img = container.querySelector('img');
    expect(img?.getAttribute('src')).toBe('https://exemplo.test/f.jpg');
    /* Decorativo: quem nomeia é o texto ao lado, e um `alt` com o nome faria o
       leitor de tela anunciar a pessoa duas vezes. */
    expect(img?.getAttribute('alt')).toBe('');
    expect(container.querySelector('[data-gerado]')).toBeNull();
  });

  it('sem foto, gera campo e mostra as iniciais — nunca uma silhueta', () => {
    const { container } = render(<RetratoMentor nome="Equipe Subido" />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('[data-gerado]')).not.toBeNull();
    expect(container.textContent).toBe('ES');
  });

  it('o mesmo nome dá sempre o mesmo campo', () => {
    expect(campo('Equipe Subido · Tráfego')).toBe(campo('Equipe Subido · Tráfego'));
  });

  it('nomes da mesma família dão campos visivelmente diferentes', () => {
    const nomes = [
      'Equipe Subido · Tráfego',
      'Equipe Subido · Produto',
      'Equipe Subido · Comercial',
      'Equipe Subido · Implementação',
    ];
    const eixos = nomes.map((n) => {
      const h = hashDeterminista(n);
      return [fatia(h, 0), fatia(h, 8), fatia(h, 16)];
    });

    for (let i = 0; i < eixos.length; i += 1) {
      for (let j = i + 1; j < eixos.length; j += 1) {
        const a = eixos[i]!;
        const b = eixos[j]!;
        /* Basta UM eixo bem separado para os campos lerem como diferentes — é
           assim que o olho compara duas manchas de luz. */
        const maiorDiferenca = Math.max(...a.map((v, k) => Math.abs(v - b[k]!)));
        expect(maiorDiferenca).toBeGreaterThan(0.15);
      }
    }
  });

  /**
   * As duas luzes saem de BANDAS SEPARADAS (12–38 e 62–88), não de um espelho em
   * torno do centro. Este teste já reprovou a primeira versão, que usava
   * `100 − x` e cujo comentário afirmava garantir 22 pontos: com x ≈ 50 as duas
   * caíam no mesmo lugar, e a medição deu 18,4. O piso real agora é 24.
   */
  it('as duas luzes nunca caem do mesmo lado', () => {
    for (const nome of ['Equipe Subido · Tráfego', 'Ana', 'Z', 'Um Nome Bem Mais Longo Aqui']) {
      const estilo = campo(nome);
      const x = Number(/--retrato-x:\s*([\d.]+)%/.exec(estilo)?.[1]);
      const x2 = Number(/--retrato-x2:\s*([\d.]+)%/.exec(estilo)?.[1]);
      expect(Math.abs(x - x2)).toBeGreaterThanOrEqual(24);
    }
  });

  /* A paleta não se abre: o hash varia posição, força e ângulo — nunca matiz. Um
     gerador que sorteasse hue seria a porta de entrada do roxo "IA" que a marca
     bane, e o gate de identidade não pega valor vindo de JS. */
  it('o hash só produz geometria, nunca cor', () => {
    const estilo = campo('Qualquer Mentor');
    expect(estilo).toMatch(/--retrato-x/);
    expect(estilo).toMatch(/--retrato-ang/);
    expect(estilo).not.toMatch(/#|rgb|hsl/);
  });

  it('as fatias do hash ficam no intervalo 0–1', () => {
    const h = hashDeterminista('Equipe Subido');
    for (const d of [0, 8, 16, 24]) {
      const v = fatia(h, d);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});
