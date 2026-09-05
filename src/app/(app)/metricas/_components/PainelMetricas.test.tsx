import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { criarMetricasPreview } from '@/app/preview/metricas/fixture';
import { PainelMetricas } from './PainelMetricas';

describe('Leitura essencial das métricas', () => {
  it('mostra os cinco volumes uma única vez antes dos detalhes', () => {
    const { container } = render(<PainelMetricas metricas={criarMetricasPreview()} />);
    const funil = screen.getByRole('region', { name: 'Funil de vendas' });
    expect(within(funil).getAllByRole('listitem')).toHaveLength(5);
    expect(within(funil).getByText('42')).toBeInTheDocument();
    expect(within(funil).getByText('24')).toBeInTheDocument();
    expect(container.querySelectorAll('details[open]')).toHaveLength(0);
    expect(screen.getByRole('link', { name: 'Organizar vendas' })).toHaveAttribute(
      'href',
      '/vendas',
    );
    expect(within(funil).getByText(/não etapas das mesmas empresas/)).toBeInTheDocument();
  });

  it('separa zero de falta de base e não inventa preenchimento', () => {
    const { container } = render(<PainelMetricas metricas={criarMetricasPreview('vazio')} />);
    for (const bar of container.querySelectorAll<HTMLElement>('[style*="--volume"]')) {
      expect(bar.style.getPropertyValue('--volume')).toBe('0%');
    }
    expect(
      within(screen.getByRole('region', { name: 'Funil de vendas' })).getByText('Sem base'),
    ).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/NaN|Infinity/);
    expect(screen.getByRole('link', { name: 'Criar lista' })).toHaveAttribute(
      'href',
      '/prospeccao',
    );
  });

  it('usa a mesma escala mesmo quando oportunidades superam abordagens', () => {
    const { container } = render(<PainelMetricas metricas={criarMetricasPreview('avulso')} />);
    const largura = (id: string) =>
      container
        .querySelector<HTMLElement>(`[data-indicador="${id}"] [style]`)!
        .style.getPropertyValue('--volume');
    expect(largura('oportunidades')).toBe('100%');
    expect(parseFloat(largura('abordagens'))).toBeCloseTo(100 / 9);
    expect(container.textContent).toContain('900%');
    expect(container.textContent).toContain('Podem superar 100%');
  });

  it('preserva variações negativas, positivas e sem base nos detalhes', () => {
    const metricas = criarMetricasPreview();
    metricas.periodoAnterior = {
      prospeccoes: 21,
      abordagens: 48,
      oportunidades: 9,
      propostas: 0,
      ganhos: 0,
      perdas: 0,
    };
    const { container } = render(<PainelMetricas metricas={metricas} />);
    const comparacoes = container.querySelector('table')!;
    expect(comparacoes.textContent).toContain('+100%');
    expect(comparacoes.textContent).toContain('-50%');
    expect(comparacoes.textContent).toContain('Sem mudança');
    expect(comparacoes.textContent).toContain('Sem base anterior');
    expect(comparacoes.textContent).not.toMatch(/NaN|Infinity/);
  });

  it('não inventa um período anterior ao selecionar todo o histórico', () => {
    const { container } = render(<PainelMetricas metricas={criarMetricasPreview('total')} />);
    expect(container.querySelector('table')).toBeNull();
    expect(container.textContent).toContain('Não há período anterior para comparar');
    expect(screen.getByRole('link', { name: 'Tudo' })).toHaveAttribute('aria-current', 'page');
  });
});
