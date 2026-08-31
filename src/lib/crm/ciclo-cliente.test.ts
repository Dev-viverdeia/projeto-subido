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

describe('ciclo factual do cliente', () => {
  it('começa pelo enriquecimento e mostra o ciclo completo', () => {
    const ciclo = montarCicloCliente(leadBase());

    expect(ciclo.etapas.map((etapa) => etapa.rotulo)).toEqual([
      'Preparar',
      'Descobrir',
      'Propor',
      'Entregar',
      'Concluir',
    ]);
    expect(ciclo.etapas.map((etapa) => etapa.estado)).toEqual([
      'atual',
      'futura',
      'futura',
      'futura',
      'futura',
    ]);
    expect(ciclo.etapas[0]).toMatchObject({ evidencia: 'Enriquecimento recomendado' });
    expect(ciclo.decisao).toMatchObject({
      tipo: 'enriquecer',
      acao: 'Enriquecer dados',
      apoioRotulo: 'Agendar sem enriquecer',
    });
  });

  it('não deixa um rascunho pular a reunião de descoberta', () => {
    const lead = leadBase();
    lead.propostaRecente = {
      id: '55555555-5555-4555-8555-555555555555',
      titulo: 'Proposta de atendimento',
      status: 'rascunho',
      reuniaoId: null,
    };

    const ciclo = montarCicloCliente(lead);

    expect(ciclo.etapas[1]).toMatchObject({ estado: 'atual', evidencia: 'Reunião pendente' });
    expect(ciclo.etapas[2]).toMatchObject({ estado: 'futura', evidencia: 'Rascunho' });
    expect(ciclo.decisao).toMatchObject({
      rotulo: 'Descoberta pendente',
      acao: 'Agendar descoberta',
      apoioRotulo: 'Abrir rascunho',
    });
  });

  it('abre a reunião já agendada antes de sugerir uma proposta', () => {
    const lead = leadBase();
    lead.calls = [
      {
        id: '33333333-3333-4333-8333-333333333333',
        titulo: 'Descoberta com Camila',
        tipo: 'descoberta',
        status: 'agendada',
        agendadaPara: '2026-08-14T12:00:00.000Z',
        iniciadaEm: null,
        encerradaEm: null,
        duracaoMinutos: 45,
        codigoPublico: '44444444-4444-4444-8444-444444444444',
      },
    ];

    const ciclo = montarCicloCliente(lead);

    expect(ciclo.decisao).toMatchObject({
      titulo: 'Prepare Descoberta com Camila',
      href: `/sala/${lead.calls[0]!.codigoPublico}`,
      acao: 'Abrir reunião',
    });
  });

  it('leva a descoberta concluída para uma proposta ligada à mesma reunião', () => {
    const lead = leadBase();
    descobertaConcluida(lead);

    const ciclo = montarCicloCliente(lead);

    expect(ciclo.etapas[1]).toMatchObject({ estado: 'concluida' });
    expect(ciclo.etapas[2]).toMatchObject({ estado: 'atual' });
    expect(ciclo.decisao).toMatchObject({
      acao: 'Montar proposta',
      href: `/propostas/nova?oportunidade=${lead.oportunidade.id}&reuniao=${lead.calls[0]!.id}`,
      apoioRotulo: 'Revisar descoberta',
    });
  });

  it('preserva na proposta o projeto recomendado pela prospecção', () => {
    const lead = leadBase();
    lead.empresa.projetoSugeridoSlug = 'sdr-atendimento-qualificacao';
    descobertaConcluida(lead);

    const ciclo = montarCicloCliente(lead);

    expect(ciclo.decisao.href).toBe(
      `/propostas/nova?oportunidade=${lead.oportunidade.id}&reuniao=${lead.calls[0]!.id}&projeto=sdr-atendimento-qualificacao`,
    );
  });

  it('só recomenda continuar a proposta depois da descoberta', () => {
    const lead = leadBase();
    descobertaConcluida(lead);
    lead.propostaRecente = {
      id: '55555555-5555-4555-8555-555555555555',
      titulo: 'Proposta de atendimento',
      status: 'rascunho',
      reuniaoId: lead.calls[0]!.id,
    };

    const ciclo = montarCicloCliente(lead);

    expect(ciclo.decisao).toMatchObject({
      rotulo: 'Proposta em andamento',
      acao: 'Continuar proposta',
      apoioRotulo: 'Revisar descoberta',
    });
  });

  it('leva uma proposta aceita para o início da entrega quando o projeto ainda não existe', () => {
    const lead = leadBase();
    lead.oportunidade.etapa = 'ganho';
    lead.propostaRecente = {
      id: '55555555-5555-4555-8555-555555555555',
      titulo: 'Proposta aceita',
      status: 'aceita',
      reuniaoId: null,
    };

    const ciclo = montarCicloCliente(lead);

    expect(ciclo.etapas[3]).toMatchObject({ estado: 'atual' });
    expect(ciclo.decisao).toMatchObject({
      acao: 'Iniciar entrega',
      href: `/propostas/${lead.propostaRecente.id}`,
    });
  });

  it('mantém a entrega ativa como próxima ação', () => {
    const lead = leadBase();
    lead.projetoAtivo = {
      id: '66666666-6666-4666-8666-666666666666',
      titulo: 'SDR de Atendimento',
      status: 'em_execucao',
      atualizadoEm: '2026-08-13T15:00:00.000Z',
    };
    lead.projetoRecente = lead.projetoAtivo;

    const ciclo = montarCicloCliente(lead);

    expect(ciclo.etapas[3]).toMatchObject({ estado: 'atual', evidencia: 'Em execução' });
    expect(ciclo.decisao).toMatchObject({ acao: 'Continuar entrega' });
  });

  it('preserva a entrega concluída e abre um novo ciclo', () => {
    const lead = leadBase();
    lead.oportunidade.etapa = 'ganho';
    lead.projetoRecente = {
      id: '66666666-6666-4666-8666-666666666666',
      titulo: 'SDR de Atendimento',
      status: 'concluido',
      atualizadoEm: '2026-08-13T15:00:00.000Z',
    };

    const ciclo = montarCicloCliente(lead);

    expect(ciclo.etapas[4]).toMatchObject({ estado: 'atual', evidencia: 'Entrega comprovada' });
    expect(ciclo.decisao).toMatchObject({
      tipo: 'novo-ciclo',
      apoioHref: `/entregas/${lead.projetoRecente.id}`,
    });
  });

  it('usa o resultado da entrega para guiar a primeira conversa do novo ciclo', () => {
    const lead = leadBase();
    lead.oportunidade.proximaAcao = 'Validar a expansão para os canais de Instagram e site.';
    lead.oportunidade.proximaAcaoEm = '2026-09-09T15:00:00.000Z';
    lead.continuidadePosEntrega = {
      projetoId: '66666666-6666-4666-8666-666666666666',
      projetoTitulo: 'SDR de Atendimento',
      resumoEntrega: 'SDR implantado e validado pelo cliente.',
      resultadoPrincipal: 'Tempo de resposta reduzido.',
      resultadoObservado: 'O tempo médio de resposta caiu de 18 para 4 minutos.',
      evidenciaResultadoUrl: null,
      decisao: 'expandir',
      proximoPasso: 'Validar a expansão para os canais de Instagram e site.',
      proximoPassoEm: '2026-09-09',
      aceitaEm: '2026-08-01T12:00:00.000Z',
      registradaEm: '2026-08-31T13:00:00.000Z',
    };

    const ciclo = montarCicloCliente(lead);

    expect(ciclo.etapas[0]).toMatchObject({
      estado: 'concluida',
      evidencia: 'Dados enriquecidos',
    });
    expect(ciclo.etapas[1]).toMatchObject({ estado: 'atual', evidencia: 'Reunião pendente' });
    expect(ciclo.decisao).toMatchObject({
      rotulo: 'Expansão confirmada',
      titulo: 'Validar a expansão para os canais de Instagram e site.',
      acao: 'Agendar reunião',
      apoioHref: `/entregas/${lead.continuidadePosEntrega.projetoId}`,
    });
  });
});
