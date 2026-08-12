import { describe, expect, it } from 'vitest';
import type { DocumentoProposta } from '@/lib/propostas/schema';
import {
  briefingPodeSerConfirmado,
  mesclarBriefingComKickoff,
  montarBriefingInicial,
  textoParaItensBriefing,
} from './briefing';

const DOCUMENTO: DocumentoProposta = {
  cliente: {
    empresa: 'Clínica Aurora',
    contato: 'Camila Rios',
    cargo: 'Diretora de operações',
    email: 'camila@aurora.test',
  },
  projeto: {
    titulo: 'Atendimento inteligente',
    resumo: 'Atendimento com triagem assistida.',
    origem: 'catalogo',
  },
  desafio: 'Contatos ficam sem resposta.',
  objetivo: 'Responder rapidamente e transferir com contexto.',
  escopo: [{ titulo: 'Piloto', descricao: 'Uma unidade durante sete dias.' }],
  entregaveis: ['Agente validado'],
  cronograma: [{ fase: 'Piloto', duracao: '7 dias', descricao: 'Testes acompanhados.' }],
  investimento: { valorCentavos: 1000000, condicoes: 'À vista.' },
  validadeDias: 10,
  proximosPassos: ['Agendar kickoff'],
  observacoes: null,
};

describe('briefing de kickoff', () => {
  it('começa pela proposta quando ainda não existe análise de kickoff', () => {
    const resultado = montarBriefingInicial({
      documento: DOCUMENTO,
      dadosAnalise: null,
      resumoAnalise: null,
      callId: null,
    });

    expect(resultado.origem).toBe('proposta');
    expect(resultado.briefing.objetivo).toBe(DOCUMENTO.objetivo);
    expect(resultado.briefing.responsavelCliente).toBe('Camila Rios');
    expect(resultado.briefing.confirmadoEm).toBeNull();
  });

  it('prioriza fatos confirmados no kickoff sem inventar campos ausentes', () => {
    const resultado = montarBriefingInicial({
      documento: DOCUMENTO,
      dadosAnalise: {
        briefing_operacional: {
          objetivo: 'Validar o atendimento em uma unidade.',
          criterio_sucesso: '90% das conversas respondidas em até um minuto.',
          responsavel_cliente: 'Camila Rios',
          responsavel_tecnico: null,
          acessos: ['WhatsApp Business'],
          limites: ['Dúvidas clínicas seguem para a recepção'],
          proximos_passos: ['Camila libera o acesso até sexta-feira'],
        },
      },
      resumoAnalise: 'O piloto ficou restrito a uma unidade.',
      callId: '11111111-1111-4111-8111-111111111111',
    });

    expect(resultado.origem).toBe('kickoff');
    expect(resultado.briefing.criterioSucesso).toContain('90%');
    expect(resultado.briefing.responsavelTecnico).toBe('');
    expect(resultado.briefing.fonteCallId).toBe('11111111-1111-4111-8111-111111111111');
    expect(briefingPodeSerConfirmado(resultado.briefing)).toBe(false);
  });

  it('transforma uma lista por linha e remove marcadores visuais', () => {
    expect(textoParaItensBriefing('- WhatsApp\n* Agenda\n\nCRM')).toEqual([
      'WhatsApp',
      'Agenda',
      'CRM',
    ]);
  });

  it('completa um rascunho com o kickoff sem apagar decisões já revisadas', () => {
    const salvo = montarBriefingInicial({
      documento: DOCUMENTO,
      dadosAnalise: null,
      resumoAnalise: null,
      callId: null,
    }).briefing;
    salvo.objetivo = 'Objetivo já revisado pelo profissional.';
    const extraido = montarBriefingInicial({
      documento: DOCUMENTO,
      dadosAnalise: {
        briefing_operacional: {
          objetivo: 'Objetivo dito na call.',
          criterio_sucesso: '90% em até um minuto.',
          responsavel_cliente: 'Camila Rios',
          responsavel_tecnico: 'Mateus Silva',
          acessos: ['WhatsApp Business'],
          limites: ['Dúvidas clínicas seguem para a recepção'],
          proximos_passos: ['Liberar os acessos'],
        },
      },
      resumoAnalise: 'Kickoff concluído.',
      callId: '22222222-2222-4222-8222-222222222222',
    }).briefing;

    const resultado = mesclarBriefingComKickoff(salvo, extraido);
    expect(resultado.objetivo).toBe('Objetivo já revisado pelo profissional.');
    expect(resultado.criterioSucesso).toBe('90% em até um minuto.');
    expect(resultado.acessos).toEqual(['WhatsApp Business']);
    expect(resultado.fonteCallId).toBe('22222222-2222-4222-8222-222222222222');
  });
});
