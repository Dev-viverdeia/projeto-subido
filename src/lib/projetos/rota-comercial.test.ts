import { describe, expect, it } from 'vitest';
import type { OportunidadeSeletor } from '@/lib/crm/queries';
import { montarRotaComercialProjeto } from './rota-comercial-modelo';

const oportunidades: OportunidadeSeletor[] = [
  {
    id: 'aberta',
    titulo: 'Atendimento com IA',
    etapa: 'descoberta',
    empresa: 'Clínica Aurora',
    dominio: null,
    contato: 'Camila',
  },
  {
    id: 'ganha',
    titulo: 'SDR com IA',
    etapa: 'ganho',
    empresa: 'Rede Norte',
    dominio: null,
    contato: 'Rui',
  },
  {
    id: 'encerrada',
    titulo: 'Projeto antigo',
    etapa: 'perdido',
    empresa: 'Empresa Sul',
    dominio: null,
    contato: null,
  },
];

describe('rota comercial do Projeto', () => {
  it('prioriza a entrega ativa e mantém uma oportunidade aberta sem proposta', () => {
    const rota = montarRotaComercialProjeto(
      oportunidades,
      [
        {
          id: 'proposta-1',
          oportunidade_id: 'ganha',
          status: 'aceita',
          atualizado_em: '2026-08-11T12:00:00.000Z',
        },
      ],
      [
        {
          id: 'execucao-1',
          oportunidade_id: 'ganha',
          status: 'em_execucao',
          atualizado_em: '2026-08-12T12:00:00.000Z',
        },
      ],
    );

    expect(rota.oportunidades.map((item) => item.id)).toEqual(['ganha', 'aberta']);
    expect(rota.oportunidadeInicialId).toBe('ganha');
    expect(rota.oportunidades[0]?.execucao?.id).toBe('execucao-1');
  });

  it('não traz negócio encerrado sem vínculo com este Projeto', () => {
    const rota = montarRotaComercialProjeto(oportunidades, [], []);

    expect(rota.oportunidades).toHaveLength(1);
    expect(rota.oportunidades[0]?.id).toBe('aberta');
  });
});
