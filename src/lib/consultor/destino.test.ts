import { describe, expect, it } from 'vitest';
import { SinaisSobralSchema, type AcaoSobral, type SinaisSobral } from './direcao';
import { resolverAcaoSobral } from './destino';

const OPORTUNIDADE = '11111111-1111-4111-8111-111111111111';

function sinais(alteracoes: Partial<SinaisSobral> = {}): SinaisSobral {
  return SinaisSobralSchema.parse({
    momento: '2026-08-13T12:00:00.000Z',
    oportunidades: {
      total: 1,
      abertas: 1,
      semProximaAcao: 0,
      emDescoberta: 1,
      emPropostaOuNegociacao: 0,
      ganhas: 0,
    },
    calls: { total: 0, agendadas: 0, concluidas: 0 },
    propostas: { total: 0, rascunhos: 0, prontas: 0, apresentadas: 0, aceitas: 0 },
    studio: { total: 0, prontos: 0 },
    projetos: { total: 0, ativos: 0, acoesPendentes: 0, acoesAtrasadas: 0 },
    radar: [],
    catalogo: [],
    foco: {
      oportunidadeId: OPORTUNIDADE,
      titulo: 'Atendimento com IA',
      empresa: 'Clínica Aurora',
      etapa: 'descoberta',
      proximaAcao: 'Agendar descoberta',
      proximaAcaoEm: null,
    },
    ...alteracoes,
  });
}

function acao(destino: AcaoSobral['destino']): AcaoSobral {
  return {
    titulo: 'Executar o movimento prioritário',
    detalhe: 'Use o contexto real da operação e conclua apenas esta frente agora.',
    evidencia: 'Movimento registrado na plataforma.',
    destino,
  };
}

describe('resolverAcaoSobral', () => {
  it('abre a proposta existente em vez da página geral', () => {
    const contexto = sinais({
      radar: [
        {
          id: 'propostas-proposta-1',
          dominio: 'propostas',
          titulo: 'Apresentar proposta',
          contexto: 'Clínica Aurora',
          momento: 'Pronta para apresentar',
          estado: 'aguardando',
          destino: '/propostas/proposta-1',
          prioridade: 100,
        },
      ],
    });

    expect(resolverAcaoSobral(acao('/propostas'), contexto)).toEqual({
      destino: '/propostas/proposta-1',
      rotulo: 'Abrir proposta',
    });
  });

  it('leva o cliente em foco para a nova proposta', () => {
    expect(resolverAcaoSobral(acao('/propostas/nova'), sinais())).toEqual({
      destino: `/propostas/nova?oportunidade=${OPORTUNIDADE}`,
      rotulo: 'Criar proposta',
    });
  });

  it('abre o agendamento de call já vinculado ao cliente', () => {
    expect(resolverAcaoSobral(acao('/calls'), sinais())).toEqual({
      destino: `/calls?nova=1&oportunidade=${OPORTUNIDADE}`,
      rotulo: 'Agendar call',
    });
  });

  it('leva o cliente para a personalização no Estúdio', () => {
    expect(resolverAcaoSobral(acao('/builder'), sinais())).toEqual({
      destino: `/builder?oportunidade=${OPORTUNIDADE}`,
      rotulo: 'Personalizar projeto',
    });
  });

  it('mantém um destino seguro quando ainda não há contexto comercial', () => {
    const contexto = sinais({
      oportunidades: {
        total: 0,
        abertas: 0,
        semProximaAcao: 0,
        emDescoberta: 0,
        emPropostaOuNegociacao: 0,
        ganhas: 0,
      },
      foco: null,
    });

    expect(resolverAcaoSobral(acao('/calls'), contexto)).toEqual({
      destino: '/calls',
      rotulo: 'Agendar call',
    });
  });
});
