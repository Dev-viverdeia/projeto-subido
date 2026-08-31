import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MudancaEscopoProjeto } from '@/lib/projetos-execucao/queries';

vi.mock('@/lib/projetos-execucao/escopo-actions', () => ({
  analisarMudancaEscopo: vi.fn(),
}));

import { MudancasEscopoProjeto } from './MudancasEscopoProjeto';

const MUDANCA: MudancaEscopoProjeto = {
  id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  titulo: 'Incluir atendimento pelo Instagram',
  descricao: 'O cliente quer adicionar um novo canal ao agente.',
  status: 'em_analise',
  classificacao: null,
  resposta: null,
  impactoPrazoDias: null,
  impactoValorCentavos: null,
  solicitadoPor: 'cliente',
  criadoEm: '2026-08-10T12:00:00.000Z',
  analisadoEm: null,
  decididoEm: null,
};

describe('MudancasEscopoProjeto', () => {
  it('leva o pedido do cliente para uma decisão objetiva de escopo', () => {
    render(
      <MudancasEscopoProjeto
        projetoId="11111111-1111-4111-8111-111111111111"
        mudancas={[MUDANCA]}
      />,
    );

    expect(screen.getByRole('heading', { name: MUDANCA.titulo })).toBeVisible();
    expect(screen.getByRole('button', { name: /Sim, já está incluído/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /Não, amplia o projeto/i })).toBeVisible();
  });
});
