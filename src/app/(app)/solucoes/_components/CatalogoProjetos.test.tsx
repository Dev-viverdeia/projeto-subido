import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CatalogoProjetos } from './CatalogoProjetos';

describe('catálogo de projetos', () => {
  it('não promete projetos inexistentes e oferece uma continuação útil', () => {
    render(<CatalogoProjetos solucoes={[]} />);

    expect(
      screen.getByRole('heading', {
        name: 'Os projetos guiados ainda não foram publicados.',
      }),
    ).toBeDefined();
    expect(screen.queryByText('Cinco projetos.')).toBeNull();
    expect(screen.getByRole('link', { name: /Continuar em Formações/ }).getAttribute('href')).toBe(
      '/formacoes',
    );
  });
});
