import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SubidoLogo } from './SubidoLogo';

describe('SubidoLogo', () => {
  it('expõe a Subido como marca principal sem renderizar o lockup do Viver de IA', () => {
    const { container } = render(<SubidoLogo size={18} />);

    expect(screen.getByRole('img', { name: 'Subido' })).toBeVisible();
    expect(screen.getByText('subido')).toBeVisible();
    expect(screen.queryByText(/Viver de IA/i)).toBeNull();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
