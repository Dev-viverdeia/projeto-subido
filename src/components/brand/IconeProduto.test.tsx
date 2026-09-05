import { render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import Link from 'next/link';
import { describe, expect, it } from 'vitest';
import { ITEM_ADMIN, ITEM_CONTA, ITENS_NAV } from '@/app/(app)/_components/navegacao';
import { IconeProduto, type AreaIconeProduto } from './IconeProduto';

const AREAS: AreaIconeProduto[] = [
  'inicio',
  'sobral',
  'formacoes',
  'projetos',
  'estudio',
  'mentorias',
  'certificados',
  'prospeccao',
  'vendas',
  'metricas',
  'reunioes',
  'propostas',
  'entregas',
  'admin',
  'conta',
];

describe('IconeProduto', () => {
  it.each(AREAS)('%s tem desenho serializável, cor herdada e traço consistente', (nome) => {
    const html = renderToStaticMarkup(<IconeProduto nome={nome} />);
    expect(html).toContain('viewBox="0 0 24 24"');
    expect(html).toContain('stroke="currentColor"');
    expect(html).toContain('stroke-width="1.65"');
    expect(html).toContain('width="22"');
    expect(html).toContain('<path');
    expect(html).not.toMatch(/<image|<filter|<script|url\(/);
  });

  it('preserva o nome acessível do destino sem adicionar outro foco', () => {
    const { container } = render(
      <Link href="/formacoes">
        <IconeProduto nome="formacoes" tamanho={30} />
        Formações
      </Link>,
    );
    expect(screen.getByRole('link', { name: 'Formações' })).toBeVisible();
    expect(screen.queryByRole('img')).toBeNull();
    expect(container.querySelector('svg')).toHaveAttribute('focusable', 'false');
    expect(container.querySelector('svg')).toHaveAttribute('width', '30');
  });

  it('cobre todos os destinos do menu com pictogramas distintos da mesma família', () => {
    const desenhos = [...ITENS_NAV, ITEM_ADMIN, ITEM_CONTA].map((item) =>
      renderToStaticMarkup(<>{item.icone}</>),
    );
    expect(desenhos).toHaveLength(AREAS.length);
    expect(new Set(desenhos).size).toBe(AREAS.length);
    desenhos.forEach((html) => expect(html).toContain('data-icone-produto='));
  });
});
