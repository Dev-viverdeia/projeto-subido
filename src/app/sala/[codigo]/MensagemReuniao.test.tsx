import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MensagemReuniao } from './MensagemReuniao';

describe('mensagem da reunião', () => {
  it('expõe o endereço e a nova aba sem permitir controle da sala pelo destino', () => {
    const url = 'https://exemplo.test/proposta?token=abc%2B123#escopo';
    render(<MensagemReuniao autor="Camila" texto={`Segue a proposta: ${url}`} />);
    const link = screen.getByRole('link', { name: `${url} (abre em outra aba)` });
    expect(link).toHaveAttribute('href', url);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByText('Camila')).toBeVisible();
  });

  it('mostra HTML como texto, sem criar scripts, imagens nem prévias externas', () => {
    const { container } = render(
      <MensagemReuniao autor="Camila" texto={'<img src=x onerror=alert(1)> javascript:alert(1)'} />,
    );
    expect(container.querySelectorAll('img, script, iframe, a')).toHaveLength(0);
    expect(screen.getByText('<img src=x onerror=alert(1)> javascript:alert(1)')).toBeVisible();
  });

  it('identifica as próprias mensagens sem repetir o nome', () => {
    render(<MensagemReuniao autor="Rafael" texto="Vamos revisar." propria />);
    expect(screen.getByText('Você')).toBeVisible();
    expect(screen.queryByText('Rafael')).not.toBeInTheDocument();
  });
});
