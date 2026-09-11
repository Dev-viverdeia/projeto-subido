import { describe, expect, it } from 'vitest';
import type { DossieLead } from './dossie-types';
import { montarCicloCliente } from './ciclo-cliente';

function leadBase(): DossieLead {
  return {
    oportunidade: {
      id: '11111111-1111-4111-8111-111111111111',
      titulo: 'Atendimento com IA',
      etapa: 'novo_lead',
      empresaId: '22222222-2222-4222-8222-222222222222',
      empresa: 'Clínica Aurora',
      dominio: null,
      enriquecidoEm: null,
      enriquecimentoStatus: null,
      contatoId: null,
      contato: 'Camila',
      contatoEmail: null,
      valorCentavos: null,
      proximaAcao: null,
      proximaAcaoEm: null,
      ganhaEm: null,
      perdidaEm: null,
      motivoPerda: null,
      ultimoFato: null,
      ultimoFatoEm: null,
      atualizadoEm: '2026-08-13T12:00:00.000Z',
      criadoEm: '2026-08-13T12:00:00.000Z',
    },
    empresa: {
      nome: 'Clínica Aurora',
      dominio: null,
      setor: null,
      porte: null,
      cidade: null,
      estado: null,
    },
    contato: null,
    eventos: [],
    calls: [],
    acoesPlano: [],
    projetoAtivo: null,
    projetoRecente: null,
    propostaRecente: null,
    enriquecimentos: [],
    totalCalls: 0,
  };
}

function descobertaConcluida(lead: DossieLead) {
  lead.calls = [
    {
      id: '33333333-3333-4333-8333-333333333333',
      titulo: 'Descoberta',
      tipo: 'descoberta',
      status: 'concluida',
      agendadaPara: '2026-08-13T12:00:00.000Z',
      iniciadaEm: '2026-08-13T12:00:00.000Z',
      encerradaEm: '2026-08-13T13:00:00.000Z',
      duracaoMinutos: 60,
      codigoPublico: '44444444-4444-4444-8444-444444444444',
    },
  ];
}

describe('etapa registrada e próximo passo independente', () => {
  it.each([
    ['novo_lead', 'Preparar'],
    ['qualificacao', 'Preparar'],
    ['descoberta', 'Descobrir'],
    ['proposta', 'Propor'],
    ['negociacao', 'Propor'],
  ] as const)(
    'preserva %s mesmo depois de enriquecer ou criar proposta offline',
    (etapa, rotulo) => {
      const lead = leadBase();
      lead.oportunidade.etapa = etapa;
      lead.oportunidade.enriquecidoEm = '2026-09-10T12:00:00Z';
      lead.propostaRecente = {
        id: 'proposta',
        titulo: 'Proposta',
        status: 'rascunho',
        reuniaoId: null,
      };
      const ciclo = montarCicloCliente(lead);
      expect(ciclo.etapas.map((e) => e.rotulo)).toEqual([
        'Preparar',
        'Descobrir',
        'Propor',
        'Ganho',
      ]);
      expect(ciclo.etapas.filter((e) => e.estado === 'atual').map((e) => e.rotulo)).toEqual([
        rotulo,
      ]);
      expect(ciclo.decisao).toMatchObject({
        acao: 'Continuar proposta',
        href: '/propostas/proposta',
      });
    },
  );

  it('enriquecer não conclui a preparação', () => {
    const lead = leadBase();
    lead.oportunidade.enriquecidoEm = '2026-09-10T12:00:00Z';
    expect(montarCicloCliente(lead).etapas.map((e) => e.estado)).toEqual([
      'atual',
      'futura',
      'futura',
      'futura',
    ]);
  });

  it('sugere enriquecimento sem torná-lo uma condição para agendar', () => {
    expect(montarCicloCliente(leadBase()).decisao).toMatchObject({
      tipo: 'enriquecer',
      acao: 'Enriquecer dados',
      apoioRotulo: 'Agendar reunião',
    });
  });

  it.each(['arquivada', 'desclassificada'] as const)('não recomenda ações para %s', (situacao) => {
    const lead = leadBase();
    lead.oportunidade.situacao = situacao;
    const ciclo = montarCicloCliente(lead);
    expect(ciclo.decisao).toMatchObject({ tipo: 'encerrado', acao: null, href: null });
    expect(ciclo.etapas.some((e) => e.estado === 'atual')).toBe(false);
  });

  it('não inventa etapas concluídas para uma venda perdida', () => {
    const lead = leadBase();
    lead.oportunidade.etapa = 'perdido';
    expect(montarCicloCliente(lead).etapas.every((e) => e.estado === 'futura')).toBe(true);
    expect(montarCicloCliente(lead).decisao.tipo).toBe('encerrado');
  });

  it('não encerra venda reaberta porque a proposta anterior foi recusada', () => {
    const lead = leadBase();
    lead.oportunidade.etapa = 'proposta';
    lead.propostaRecente = {
      id: 'proposta',
      titulo: 'Proposta',
      status: 'recusada',
      reuniaoId: null,
    };
    expect(montarCicloCliente(lead).decisao).toMatchObject({
      tipo: 'navegacao',
      acao: 'Revisar proposta',
      href: '/propostas/proposta',
    });
    expect(montarCicloCliente(lead).etapas[2]!.estado).toBe('atual');
  });

  it('mantém a próxima ação definida mesmo com enriquecimento, reunião e rascunho', () => {
    const lead = leadBase();
    descobertaConcluida(lead);
    lead.oportunidade.proximaAcao = 'Enviar escopo pelo WhatsApp';
    lead.oportunidade.proximaAcaoEm = '2026-09-12T12:00:00Z';
    lead.propostaRecente = {
      id: 'proposta',
      titulo: 'Proposta',
      status: 'rascunho',
      reuniaoId: null,
    };
    expect(montarCicloCliente(lead).decisao).toMatchObject({
      tipo: 'definida',
      titulo: 'Enviar escopo pelo WhatsApp',
      prazo: '2026-09-12T12:00:00Z',
      href: null,
      acao: null,
    });
  });

  it('não cria link circular para um compromisso sem reunião', () => {
    const lead = leadBase();
    lead.acoesPlano = [{ id: 'acao', titulo: 'Revisar escopo', prazoEm: null, reuniaoId: null }];
    expect(montarCicloCliente(lead).decisao).toMatchObject({
      tipo: 'definida',
      titulo: 'Revisar escopo',
      href: null,
    });
  });

  it('abre a reunião mais próxima e usa a data dela, não a de outra ação', () => {
    const lead = leadBase();
    descobertaConcluida(lead);
    const call = lead.calls[0]!;
    lead.calls = [
      {
        ...call,
        id: 'tardia',
        codigoPublico: 'tardia',
        status: 'agendada',
        agendadaPara: '2026-10-20T12:00:00Z',
      },
      {
        ...call,
        id: 'cedo',
        codigoPublico: 'cedo',
        status: 'agendada',
        agendadaPara: '2026-10-12T12:00:00Z',
      },
      call,
    ];
    lead.oportunidade.proximaAcaoEm = '2026-12-10T12:00:00Z';
    expect(montarCicloCliente(lead).decisao).toMatchObject({
      href: '/sala/cedo',
      prazo: '2026-10-12T12:00:00Z',
      acao: 'Abrir reunião',
    });
  });

  it('preserva a reunião e o projeto recomendado ao criar a proposta', () => {
    const lead = leadBase();
    descobertaConcluida(lead);
    lead.empresa.projetoSugeridoSlug = 'sdr-atendimento-qualificacao';
    expect(montarCicloCliente(lead).decisao.href).toBe(
      `/propostas/nova?oportunidade=${lead.oportunidade.id}&reuniao=${lead.calls[0]!.id}&projeto=sdr-atendimento-qualificacao`,
    );
    expect(montarCicloCliente(lead).etapas[0]!.estado).toBe('atual');
  });

  it('usa o histórico completo mesmo quando a descoberta não está nas reuniões recentes', () => {
    const lead = leadBase();
    lead.temDescobertaConcluida = true;
    expect(montarCicloCliente(lead).decisao).toMatchObject({
      acao: 'Criar proposta',
      href: `/propostas/nova?oportunidade=${lead.oportunidade.id}`,
    });
  });

  it('permite criar proposta na etapa Propor sem nenhuma reunião ou enriquecimento', () => {
    const lead = leadBase();
    lead.oportunidade.etapa = 'proposta';
    expect(montarCicloCliente(lead).decisao).toMatchObject({
      acao: 'Criar proposta',
      href: `/propostas/nova?oportunidade=${lead.oportunidade.id}`,
    });
  });

  it('mostra a venda ganha como concluída, sem confundi-la com a entrega', () => {
    const lead = leadBase();
    lead.oportunidade.etapa = 'ganho';
    lead.oportunidade.proximaAcao = 'Compromisso antigo';
    expect(montarCicloCliente(lead).etapas.every((e) => e.estado === 'concluida')).toBe(true);
    expect(montarCicloCliente(lead).decisao.acao).toBe('Registrar proposta');
    lead.propostaRecente = {
      id: 'proposta',
      titulo: 'Proposta',
      status: 'aceita',
      reuniaoId: null,
    };
    expect(montarCicloCliente(lead).decisao).toMatchObject({
      acao: 'Preparar entrega',
      href: '/propostas/proposta',
    });
  });

  it.each(['em_execucao', 'concluido', 'pausado'] as const)(
    'retoma a entrega existente (%s)',
    (status) => {
      const lead = leadBase();
      lead.oportunidade.etapa = 'ganho';
      lead.acoesPlano = [
        { id: 'antigo', titulo: 'Apresentar proposta', prazoEm: null, reuniaoId: null },
      ];
      lead.projetoRecente = {
        id: 'entrega',
        titulo: 'Atendimento com IA',
        status,
        atualizadoEm: '2026-09-11T12:00:00Z',
      };
      const ciclo = montarCicloCliente(lead);
      expect(ciclo.etapas[3]!.estado).toBe('concluida');
      if (status === 'concluido') {
        expect(ciclo.decisao).toMatchObject({ tipo: 'novo-ciclo', apoioHref: '/entregas/entrega' });
      } else {
        expect(ciclo.decisao).toMatchObject({ acao: 'Abrir entrega', href: '/entregas/entrega' });
      }
    },
  );
});
