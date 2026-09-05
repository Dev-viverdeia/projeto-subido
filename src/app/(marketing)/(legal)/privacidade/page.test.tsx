import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Page from './page';

describe('privacidade da integração Google Calendar', () => {
  it('explica o uso limitado e separa os dados Google dos recursos de IA', () => {
    render(<Page />);

    expect(screen.getByText(/não são usados, retidos ou compartilhados/)).toHaveTextContent(
      'treinar modelos generalizados',
    );
    expect(screen.getByText(/não envia esses dados aos modelos de IA/)).toBeInTheDocument();
    expect(screen.getByText(/não são importadas do Google Calendar/)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Política de Dados do Usuário do Google Workspace/ }),
    ).toHaveAttribute(
      'href',
      'https://developers.google.com/workspace/workspace-api-user-data-developer-policy',
    );
    expect(screen.getByText(/remove a credencial armazenada/)).toBeInTheDocument();
  });
});
