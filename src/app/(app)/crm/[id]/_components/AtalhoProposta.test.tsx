import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { DossieLead } from '@/lib/crm/queries';
import { AtalhoProposta } from './AtalhoProposta';

function lead(parcial: Partial<DossieLead> = {}): DossieLead {
  return {
    oportunidade: { id: 'oportunidade-1' },
    calls: [],
    projetoAtivo: null,
    projetoRecente: null,
    propostaRecente: null,
    ...parcial,
  } as DossieLead;
}

describe('AtalhoProposta', () => {
  it('mantém a proposta visível, mas não permite pular a descoberta', () => {
    render(<AtalhoProposta lead={lead({ temDescobertaConcluida: false })} />);

    expect(screen.getByText('Proposta após descoberta')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.queryByRole('link', { name: /Criar proposta/ })).not.toBeInTheDocument();
  });

  it('libera a proposta quando a descoberta foi concluída', () => {
    render(<AtalhoProposta lead={lead({ temDescobertaConcluida: true })} />);

    expect(screen.getByRole('link', { name: 'Criar proposta' })).toHaveAttribute(
      'href',
      '/propostas/nova?oportunidade=oportunidade-1',
    );
  });

  it('mantém uma proposta existente acessível', () => {
    render(
      <AtalhoProposta
        lead={lead({
          temDescobertaConcluida: false,
          propostaRecente: {
            id: 'proposta-1',
            titulo: 'Proposta SDR',
            status: 'rascunho',
            reuniaoId: null,
          },
        })}
      />,
    );

    expect(screen.getByRole('link', { name: 'Ver proposta' })).toHaveAttribute(
      'href',
      '/propostas/proposta-1',
    );
  });
});
