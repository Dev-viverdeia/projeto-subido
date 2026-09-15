import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CopiarCanal } from './CopiarCanal';

afterEach(() => vi.unstubAllGlobals());
describe('cópia de contato', () => {
  it('copia e confirma sem mudar o destino do controle', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    render(<CopiarCanal valor="contato@empresa.com" />);
    fireEvent.click(screen.getByRole('button', { name: 'Copiar contato@empresa.com' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Contato copiado'));
    expect(writeText).toHaveBeenCalledWith('contato@empresa.com');
  });
  it('oferece recuperação quando o navegador bloqueia a cópia', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    render(<CopiarCanal valor="contato@empresa.com" />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('copie manualmente'));
  });
});
