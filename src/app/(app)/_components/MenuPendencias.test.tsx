import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MenuPendencias } from './MenuPendencias';
import type { PendenciaEntrega } from '@/lib/projetos-execucao/alertas';

const PENDENCIAS: PendenciaEntrega[] = [
  {
    id: 'projeto-1:ajustes',
    projetoId: 'projeto-1',
    href: '/entregas/projeto-1',
    empresa: 'Clínica Horizonte',
    projeto: 'Atendimento com IA',
    motivo: 'Ajustes solicitados',
    detalhe: '2 itens para revisar',
    tipo: 'ajustes',
  },
];

describe('MenuPendencias', () => {
  it('não ocupa o cabeçalho quando não há pendências', () => {
    const { container } = render(<MenuPendencias pendencias={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('abre os fatos da entrega e aponta para o projeto certo', () => {
    render(<MenuPendencias pendencias={PENDENCIAS} />);

    fireEvent.click(screen.getByRole('button', { name: '1 pendência de entrega' }));

    expect(screen.getByText('O que precisa de atenção')).toBeInTheDocument();
    expect(screen.getByText('Ajustes solicitados')).toBeInTheDocument();
    expect(screen.getByText('Clínica Horizonte')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ajustes solicitados/i })).toHaveAttribute(
      'href',
      '/entregas/projeto-1',
    );
  });

  it('fecha com Escape e devolve o foco ao gatilho', () => {
    render(<MenuPendencias pendencias={PENDENCIAS} />);
    const gatilho = screen.getByRole('button', { name: '1 pendência de entrega' });

    fireEvent.click(gatilho);
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByText('O que precisa de atenção')).not.toBeInTheDocument();
    expect(gatilho).toHaveFocus();
  });
});
