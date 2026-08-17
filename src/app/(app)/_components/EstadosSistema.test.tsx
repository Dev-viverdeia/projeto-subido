import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CarregandoModulo } from './CarregandoModulo';
import { EstadoSistema } from './EstadoSistema';

afterEach(cleanup);

describe('estados globais da plataforma', () => {
  it('comunica o destino enquanto o módulo ainda carrega', () => {
    render(<CarregandoModulo anatomia="pipeline" />);

    expect(screen.getByRole('status', { name: 'Preparando o CRM' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(
      screen.getByText('Organizando oportunidades, etapas e próximos movimentos.'),
    ).toBeVisible();
    expect(screen.getByRole('heading', { name: 'CRM', level: 1 })).toHaveClass('sr-only');
  });

  it('oferece recuperação clara quando uma tela falha', () => {
    render(
      <EstadoSistema
        urgente
        etiqueta="Falha temporária"
        titulo="A tela não chegou."
        descricao="Tente novamente."
        icone={<span>ícone</span>}
        acoes={<button type="button">Tentar novamente</button>}
        passos={[
          { rotulo: 'Primeiro', valor: 'Refaça a tentativa.' },
          { rotulo: 'Depois', valor: 'Volte ao início.' },
        ]}
      />,
    );

    expect(screen.getByRole('alert')).toHaveAccessibleName('A tela não chegou.');
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
    expect(screen.getByText('Refaça a tentativa.')).toBeInTheDocument();
  });
});
