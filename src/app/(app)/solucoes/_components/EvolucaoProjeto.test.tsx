import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { EncerramentoProjeto } from '@/lib/projetos-execucao/encerramento';
import type { EvolucaoProjeto as Evolucao } from '@/lib/projetos-execucao/evolucao';

vi.mock('@/lib/projetos-execucao/evolucao-actions', () => ({
  agendarRevisaoResultado: vi.fn(),
  registrarRevisaoResultado: vi.fn(),
  iniciarContinuidadeComercial: vi.fn(),
}));

import { EvolucaoProjeto } from './EvolucaoProjeto';

const ENCERRAMENTO: EncerramentoProjeto = {
  id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2',
  status: 'encerrado',
  resumoEntrega: 'Atendimento configurado, testado e entregue.',
  resultadoPrincipal: 'O fluxo passou pelos testes combinados.',
  evidenciaResultadoUrl: null,
  garantiaDias: 30,
  garantiaCobre: 'Correções do fluxo entregue.',
  garantiaNaoCobre: 'Novas funcionalidades.',
  canalSuporte: 'suporte@exemplo.com',
  responsavelContinuidade: 'Camila Rios',
  orientacaoContinuidade: 'Acompanhar os indicadores semanalmente.',
  enviadoEm: '2026-08-10T17:10:00.000Z',
  aceitoEm: '2026-08-10T18:20:00.000Z',
  garantiaTerminaEm: '2026-09-09T18:20:00.000Z',
};

const AGENDADA: Evolucao = {
  id: 'ffffffff-ffff-4fff-8fff-fffffffffff1',
  status: 'agendada',
  revisaoEm: '2026-09-09',
  resultadoObservado: null,
  evidenciaResultadoUrl: null,
  decisao: null,
  proximoPasso: null,
  proximoPassoEm: null,
  compartilharCliente: true,
  registradaEm: null,
  oportunidadeContinuidadeId: null,
};

describe('EvolucaoProjeto', () => {
  it('conduz a revisão por resultado, decisão e próximo passo', () => {
    render(
      <EvolucaoProjeto
        projetoId="11111111-1111-4111-8111-111111111111"
        empresa="Clínica Aurora"
        encerramento={ENCERRAMENTO}
        evolucao={AGENDADA}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Confirme o resultado.' })).toBeVisible();
    expect(screen.getAllByText('09 de setembro de 2026').length).toBeGreaterThan(0);
    expect(screen.getByRole('group', { name: 'O que acontece agora?' })).toBeVisible();
    expect(screen.getByRole('button', { name: /Registrar resultado/i })).toBeVisible();
  });

  it('oferece uma nova venda somente quando a decisão abre outro projeto', () => {
    render(
      <EvolucaoProjeto
        projetoId="11111111-1111-4111-8111-111111111111"
        empresa="Clínica Aurora"
        encerramento={ENCERRAMENTO}
        evolucao={{
          ...AGENDADA,
          status: 'registrada',
          resultadoObservado: 'A equipe reduziu o tempo de primeira resposta no piloto.',
          decisao: 'expandir',
          proximoPasso: 'Definir o segundo canal com a responsável.',
          proximoPassoEm: '2026-09-15',
          registradaEm: '2026-09-09T14:00:00.000Z',
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Resultado confirmado' })).toBeVisible();
    expect(screen.getByText('Expandir este projeto')).toBeVisible();
    expect(screen.getByRole('button', { name: /Criar oportunidade/i })).toBeVisible();
  });
});
