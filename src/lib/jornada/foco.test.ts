import { describe, expect, it, vi } from 'vitest';
import type { FatosJornadaOperacional } from './queries';
import { montarPlanoJornadaEmFoco } from './foco';

vi.mock('server-only', () => ({}));

const aprendizado = {
  aulasConcluidas: 1,
  formacoesConcluidas: 1,
  etapasConcluidas: 1,
  projetosConcluidos: 1,
};

const perfil = {
  nicho: 'Clínicas',
  projetoInicialId: '33333333-3333-4333-8333-333333333333',
  projetoInicialTitulo: 'SDR de Atendimento',
  projetoInicialSlug: 'sdr-atendimento',
  posicionamento: 'Implanto atendimento com IA para clínicas.',
  atualizadoEm: '2026-08-13T12:00:00.000Z',
};

describe('jornada comercial em foco', () => {
  it('não usa a descoberta e a proposta de outro cliente', () => {
    const primeiro = '11111111-1111-4111-8111-111111111111';
    const segundo = '22222222-2222-4222-8222-222222222222';
    const fatos: FatosJornadaOperacional = {
      oportunidades: [
        {
          id: primeiro,
          empresa_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          titulo: 'Clínica Aurora',
          etapa: 'novo_lead',
          proxima_acao: null,
          proxima_acao_em: null,
          atualizado_em: '2026-08-13T12:00:00.000Z',
        },
        {
          id: segundo,
          empresa_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          titulo: 'Clínica Solar',
          etapa: 'proposta',
          proxima_acao: 'Apresentar proposta',
          proxima_acao_em: '2026-08-14T12:00:00.000Z',
          atualizado_em: '2026-08-13T13:00:00.000Z',
        },
      ],
      enriquecimentos: [{ oportunidade_id: segundo, status: 'concluido' }],
      calls: [
        {
          id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
          titulo: 'Descoberta Solar',
          tipo: 'descoberta',
          status: 'concluida',
          agendada_para: '2026-08-13T12:00:00.000Z',
          oportunidade_id: segundo,
        },
      ],
      propostas: [
        {
          id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
          titulo: 'Proposta Solar',
          status: 'pronta',
          oportunidade_id: segundo,
          empresa_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          atualizado_em: '2026-08-13T13:00:00.000Z',
        },
      ],
      projetos: [],
      catalogo: [],
    };

    const planoPrimeiro = montarPlanoJornadaEmFoco({
      perfil,
      aprendizado,
      fatos,
      oportunidadeId: primeiro,
    });
    const planoSegundo = montarPlanoJornadaEmFoco({
      perfil,
      aprendizado,
      fatos,
      oportunidadeId: segundo,
    });

    expect(planoPrimeiro.etapaAtual).toBe('prospectar');
    expect(planoPrimeiro.proximoPasso.id).toBe('enriquecer-lead');
    expect(planoSegundo.etapaAtual).toBe('vender');
    expect(planoSegundo.proximoPasso.id).toBe('proposta-apresentada');
  });
});
