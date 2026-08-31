import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AcaoPlanoProjeto } from '@/lib/projetos-execucao/queries';

vi.mock('@/lib/projetos-execucao/plano-actions', () => ({
  atualizarAcaoPlano: vi.fn(),
  salvarDependenciaProjeto: vi.fn(),
}));

import { PreparacaoProjeto } from './PreparacaoProjeto';

const ACAO: AcaoPlanoProjeto = {
  id: '55555555-5555-4555-8555-555555555555',
  titulo: 'Liberar o acesso ao WhatsApp Business',
  prazoEm: '2026-08-31T15:00:00.000Z',
  status: 'pendente',
  origem: 'briefing',
  categoria: 'acesso',
  reuniaoId: null,
  responsavelTipo: 'cliente',
  responsavelNome: 'Camila Rios',
  visivelCliente: true,
  concluidaEm: null,
  atualizadoEm: '2026-08-09T12:00:00.000Z',
};

describe('PreparacaoProjeto', () => {
  it('mostra responsável, prazo, estado e atalho do portal na mesma pendência', () => {
    render(
      <PreparacaoProjeto
        projetoId="11111111-1111-4111-8111-111111111111"
        acoes={[ACAO]}
        portalAtivo
        portalCodigo="44444444-4444-4444-8444-444444444444"
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'O que falta para começar sem bloqueios' }),
    ).toBeVisible();
    expect(screen.getByText('Liberar o acesso ao WhatsApp Business')).toBeVisible();
    expect(screen.getByText('Aguardando cliente')).toBeVisible();
    expect(screen.getByText('Camila Rios')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Disponível no portal' })).toHaveAttribute(
      'href',
      '/portal/44444444-4444-4444-8444-444444444444',
    );
  });
});
