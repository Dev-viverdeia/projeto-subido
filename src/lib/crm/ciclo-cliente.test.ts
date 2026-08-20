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

describe('ciclo factual do cliente', () => {
  it('começa levando o profissional para a primeira call', () => {
    const ciclo = montarCicloCliente(leadBase());

    expect(ciclo.etapas.map((etapa) => etapa.estado)).toEqual([
      'Lead registrado',
      'Não registrada',
      'Ainda não criada',
      'Ainda não iniciada',
    ]);
    expect(ciclo.decisao).toMatchObject({ acao: 'Agendar reunião', novoCiclo: false });
  });

  it('preserva uma call real como contexto da proposta', () => {
    const lead = leadBase();
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

    const ciclo = montarCicloCliente(lead);

    expect(ciclo.decisao).toMatchObject({
      acao: 'Revisar resumo',
      apoioHref: `/propostas/nova?oportunidade=${lead.oportunidade.id}&reuniao=${lead.calls[0]!.id}`,
    });
  });

  it('mantém navegável a call que originou uma proposta', () => {
    const lead = leadBase();
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
    lead.propostaRecente = {
      id: '55555555-5555-4555-8555-555555555555',
      titulo: 'Proposta de atendimento',
      status: 'rascunho',
      reuniaoId: lead.calls[0]!.id,
    };

    const ciclo = montarCicloCliente(lead);

    expect(ciclo.etapas[1]).toMatchObject({
      href: `/reunioes/${lead.calls[0]!.id}`,
      comprovada: true,
    });
    expect(ciclo.decisao).toMatchObject({
      href: `/propostas/${lead.propostaRecente.id}`,
      apoioHref: `/reunioes/${lead.calls[0]!.id}`,
      apoioRotulo: 'Revisar reunião de origem',
    });
  });

  it('não perde o projeto quando a entrega termina e abre o próximo ciclo', () => {
    const lead = leadBase();
    lead.oportunidade.etapa = 'ganho';
    lead.propostaRecente = {
      id: '55555555-5555-4555-8555-555555555555',
      titulo: 'Proposta aceita',
      status: 'aceita',
      reuniaoId: null,
    };
    lead.projetoRecente = {
      id: '66666666-6666-4666-8666-666666666666',
      titulo: 'SDR de Atendimento',
      status: 'concluido',
      atualizadoEm: '2026-08-13T15:00:00.000Z',
    };

    const ciclo = montarCicloCliente(lead);

    expect(ciclo.etapas[3]).toMatchObject({ estado: 'Entregue', comprovada: true, atual: true });
    expect(ciclo.decisao).toMatchObject({
      titulo: 'Abrir a próxima oportunidade com Clínica Aurora',
      novoCiclo: true,
      apoioHref: `/solucoes/execucao/${lead.projetoRecente.id}`,
    });
  });
});
