import { describe, expect, it } from 'vitest';
import { contarAcoesAtrasadas, montarRadarSobral, type EntradaRadarSobral } from './radar';

const AGORA = '2026-08-10T15:00:00.000Z';

function entrada(
  mudancas: Partial<Omit<EntradaRadarSobral, 'agora' | 'empresasPorId'>> = {},
): EntradaRadarSobral {
  return {
    agora: AGORA,
    empresasPorId: new Map([
      ['empresa-1', 'Clínica Aurora'],
      ['empresa-2', 'Orbe Contabilidade'],
    ]),
    oportunidades: [],
    calls: [],
    propostas: [],
    projetos: [],
    acoes: [],
    ...mudancas,
  };
}

describe('montarRadarSobral', () => {
  it('entrega no máximo uma prioridade por domínio e aponta para o registro exato', () => {
    const resultado = montarRadarSobral(
      entrada({
        oportunidades: [
          {
            id: 'oportunidade-1',
            empresa_id: 'empresa-1',
            titulo: 'Atendimento com IA',
            etapa: 'proposta',
            proxima_acao: 'Confirmar decisor',
            proxima_acao_em: '2026-08-09T15:00:00.000Z',
            atualizado_em: AGORA,
          },
        ],
        calls: [
          {
            id: 'call-1',
            oportunidade_id: 'oportunidade-1',
            titulo: 'Descoberta Clínica Aurora',
            tipo: 'descoberta',
            status: 'ao_vivo',
            agendada_para: AGORA,
          },
        ],
        propostas: [
          {
            id: 'proposta-1',
            empresa_id: 'empresa-1',
            titulo: 'Proposta de atendimento',
            status: 'apresentada',
            atualizado_em: AGORA,
          },
        ],
        projetos: [
          {
            id: 'projeto-1',
            titulo: 'Implantação do atendimento',
            status: 'em_execucao',
            prazo_em: null,
            atualizado_em: AGORA,
          },
        ],
        acoes: [
          {
            id: 'acao-1',
            titulo: 'Validar base de conhecimento',
            empresa_id: 'empresa-1',
            oportunidade_id: 'oportunidade-1',
            projeto_execucao_id: 'projeto-1',
            reuniao_id: null,
            prazo_em: '2026-08-11T15:00:00.000Z',
            status: 'pendente',
            atualizado_em: AGORA,
          },
        ],
      }),
    );

    expect(resultado.map((item) => item.dominio)).toEqual([
      'calls',
      'crm',
      'propostas',
      'projetos',
    ]);
    expect(resultado.map((item) => item.destino)).toEqual([
      '/reunioes/call-1',
      '/vendas/oportunidade-1',
      '/propostas/proposta-1',
      '/entregas/projeto-1',
    ]);
  });

  it('explicita a lacuna quando uma oportunidade não tem próxima ação', () => {
    const [item] = montarRadarSobral(
      entrada({
        oportunidades: [
          {
            id: 'oportunidade-2',
            empresa_id: 'empresa-2',
            titulo: 'Copiloto comercial',
            etapa: 'negociacao',
            proxima_acao: null,
            proxima_acao_em: null,
            atualizado_em: AGORA,
          },
        ],
      }),
    );

    expect(item).toMatchObject({
      titulo: 'Definir a próxima ação',
      contexto: 'Orbe Contabilidade · Negociação',
      momento: 'Sem próxima ação',
      estado: 'sem_prazo',
    });
  });

  it('leva um compromisso ainda sem projeto para a call que o originou', () => {
    const [item] = montarRadarSobral(
      entrada({
        oportunidades: [
          {
            id: 'oportunidade-1',
            empresa_id: 'empresa-1',
            titulo: 'Atendimento com IA',
            etapa: 'descoberta',
            proxima_acao: 'Enviar dados solicitados',
            proxima_acao_em: null,
            atualizado_em: AGORA,
          },
        ],
        acoes: [
          {
            id: 'acao-call-1',
            titulo: 'Enviar volume mensal de atendimentos',
            empresa_id: 'empresa-1',
            oportunidade_id: 'oportunidade-1',
            projeto_execucao_id: null,
            reuniao_id: 'call-1',
            prazo_em: '2026-08-09T15:00:00.000Z',
            status: 'pendente',
            atualizado_em: AGORA,
          },
        ],
      }),
    );

    expect(item).toMatchObject({
      dominio: 'plano',
      titulo: 'Enviar volume mensal de atendimentos',
      destino: '/reunioes/call-1',
      estado: 'atrasado',
    });
  });
});

describe('contarAcoesAtrasadas', () => {
  it('conta apenas compromissos pendentes com prazo vencido', () => {
    expect(
      contarAcoesAtrasadas(
        [
          {
            id: 'acao-1',
            titulo: 'Vencida',
            empresa_id: 'empresa-1',
            oportunidade_id: 'oportunidade-1',
            projeto_execucao_id: null,
            reuniao_id: null,
            prazo_em: '2026-08-09T15:00:00.000Z',
            status: 'pendente',
            atualizado_em: AGORA,
          },
          {
            id: 'acao-2',
            titulo: 'Concluída',
            empresa_id: 'empresa-1',
            oportunidade_id: 'oportunidade-1',
            projeto_execucao_id: null,
            reuniao_id: null,
            prazo_em: '2026-08-08T15:00:00.000Z',
            status: 'concluida',
            atualizado_em: AGORA,
          },
        ],
        AGORA,
      ),
    ).toBe(1);
  });
});
