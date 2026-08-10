import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import type { FormacaoCompleta } from '@/lib/conteudo/queries';

/**
 * O QUE ESTE TESTE PROTEGE: os dois defeitos que só aparecem DEPOIS da hidratação.
 *
 * `useProgresso` é um `useSyncExternalStore` cujo snapshot de SERVIDOR é vazio —
 * o HTML sai com zero progresso e o cliente corrige no ciclo seguinte. Qualquer
 * coisa congelada no primeiro render do cliente é congelada ERRADA para quem já
 * tem progresso. Foi assim que o acordeão do currículo passou a abrir sempre no
 * módulo 1.
 *
 * O outro caso é de currículo em montagem: módulo de abertura sem aula nenhuma.
 * Nada em tsc, eslint ou build percebe qualquer um dos dois.
 */
const CHAVE = 'subido_progresso_v1';

function curso(modulos: FormacaoCompleta['modulos']): FormacaoCompleta {
  return {
    id: 'f1',
    slug: 'curso',
    titulo: 'Curso de teste',
    resumo: 'Resumo.',
    capa_url: null,
    publicado_em: null,
    modulos,
  };
}

const aula = (id: string, titulo: string, ordem: number) => ({
  id,
  titulo,
  ordem,
  duracao_seg: 600,
});

const TRES_MODULOS = curso([
  { id: 'm1', titulo: 'Módulo um', ordem: 1, aulas: [aula('a1', 'Aula 1', 1)] },
  { id: 'm2', titulo: 'Módulo dois', ordem: 2, aulas: [aula('a2', 'Aula 2', 1)] },
  { id: 'm3', titulo: 'Módulo três', ordem: 3, aulas: [aula('a3', 'Aula 3', 1)] },
]);

let Curso: (p: { formacao: FormacaoCompleta }) => React.ReactNode;

beforeEach(async () => {
  localStorage.clear();
  /* O cache de módulo do `local.ts` não sabe que o storage foi limpo. */
  vi.resetModules();
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
  Curso = (await import('./CursoConteudo')).CursoConteudo;
});

function comProgresso(aulas: string[]) {
  localStorage.setItem(
    CHAVE,
    JSON.stringify({
      aulas: Object.fromEntries(aulas.map((id) => [id, '2026-01-01T00:00:00.000Z'])),
      formacoes: {},
      etapas: {},
      solucoes: {},
    }),
  );
}

describe('conteúdo do curso', () => {
  /**
   * Regressão da HIDRATAÇÃO, e a primeira versão deste teste não valia nada.
   *
   * Ela gravava o progresso ANTES do `render` e conferia o acordeão — e passava
   * com o bug de volta, porque `render()` do testing-library NÃO hidrata: ele
   * monta direto no cliente, onde `getSnapshot` já devolve o storage cheio. O
   * defeito real precisa da ordem inversa, que é a da vida: o primeiro render vê
   * o snapshot VAZIO (é o do servidor) e o progresso chega depois.
   *
   * `StorageEvent` é o gatilho que o `local.ts` já escuta para invalidar o cache
   * de módulo — é o caminho honesto de fazer o progresso chegar TARDE.
   */
  it('acompanha o progresso que chega DEPOIS do primeiro render', () => {
    render(<Curso formacao={TRES_MODULOS} />);

    /* Primeiro render sem progresso: abre o módulo 1, e está certo. */
    expect(
      screen
        .getAllByRole('button', { expanded: true })
        .some((b) => (b.textContent ?? '').includes('Módulo um')),
    ).toBe(true);

    act(() => {
      comProgresso(['a1', 'a2']);
      window.dispatchEvent(new StorageEvent('storage', { key: CHAVE }));
    });

    const abertos = screen
      .getAllByRole('button', { expanded: true })
      .map((b) => b.textContent ?? '');

    expect(abertos.some((t) => t.includes('Módulo três'))).toBe(true);
    expect(abertos.some((t) => t.includes('Módulo um'))).toBe(false);
  });

  it('a escolha manual sobrevive à chegada do progresso', () => {
    render(<Curso formacao={TRES_MODULOS} />);

    /* Abre o módulo 3 à mão, ainda sem progresso. */
    fireEvent.click(screen.getByRole('button', { name: /Módulo três/ }));
    expect(screen.getByRole('button', { name: /Módulo três/ }).getAttribute('aria-expanded')).toBe(
      'true',
    );

    act(() => {
      comProgresso(['a1']);
      window.dispatchEvent(new StorageEvent('storage', { key: CHAVE }));
    });

    /* A assinatura mudou (a próxima aula virou a do módulo 2), então o derivado
       volta a valer — é o comportamento certo: a pessoa não escolheu nada sob
       ESTA assinatura. O que não pode é o acordeão ficar congelado no módulo 1. */
    expect(
      screen
        .getAllByRole('button', { expanded: true })
        .some((b) => (b.textContent ?? '').includes('Módulo dois')),
    ).toBe(true);
  });

  it('sem progresso nenhum, abre o primeiro módulo', () => {
    render(<Curso formacao={TRES_MODULOS} />);
    const abertos = screen
      .getAllByRole('button', { expanded: true })
      .map((b) => b.textContent ?? '');
    expect(abertos.some((t) => t.includes('Módulo um'))).toBe(true);
  });

  /* Regressão: o fallback do CTA lia `modulos[0].aulas[0]`. Um currículo em
     montagem, com o módulo de abertura ainda vazio, ficava sem CTA nenhum. */
  it('o CTA aponta para a primeira aula do CURSO, mesmo com o módulo de abertura vazio', () => {
    const emMontagem = curso([
      { id: 'm1', titulo: 'Módulo um', ordem: 1, aulas: [] },
      { id: 'm2', titulo: 'Módulo dois', ordem: 2, aulas: [aula('a9', 'Aula nove', 1)] },
    ]);
    render(<Curso formacao={emMontagem} />);

    const cta = screen.getByRole('link', { name: /Começar formação/ });
    expect(cta.getAttribute('href')).toBe('/formacoes/curso/aula/a9');
    expect(screen.getAllByText('Aula nove').length).toBeGreaterThan(0);
  });

  it('retoma dizendo qual é a próxima aula, sem botão dentro do link', () => {
    comProgresso(['a1']);
    render(<Curso formacao={TRES_MODULOS} />);

    const cta = screen.getByRole('link', { name: /Retomar aula/ });
    expect(cta.getAttribute('href')).toBe('/formacoes/curso/aula/a2');
    expect(screen.getByText('Continue de onde parou')).toBeDefined();
    expect(screen.getAllByText('Aula 2').length).toBeGreaterThan(0);
    expect(within(cta).queryByRole('button')).toBeNull();
  });

  it('o selo de estado e o trilho contam o mesmo — uma leitura só do progresso', () => {
    comProgresso(['a1', 'a2']);
    render(<Curso formacao={TRES_MODULOS} />);

    expect(screen.getByText('em andamento')).toBeDefined();
    const trilho = screen.getByRole('region', { name: 'Seu progresso' });
    expect(within(trilho).getByText(/2 de 3 aulas concluídas/)).toBeDefined();
  });

  /* Não promete certificado: o produto não tem emissão nem tabela. */
  it('concluído, a nota final confirma a conta — não inventa certificado', () => {
    comProgresso(['a1', 'a2', 'a3']);
    render(<Curso formacao={TRES_MODULOS} />);

    const trilho = screen.getByRole('region', { name: 'Seu progresso' });
    expect(trilho.textContent).toContain('As 3 aulas estão marcadas');
    expect(trilho.textContent).toContain('Salvo na sua conta');
    expect(trilho.textContent).not.toMatch(/certificado/i);
  });
});
