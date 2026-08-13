import { describe, expect, it } from 'vitest';
import type { PosCall } from './queries';
import { montarSaidaPosCall } from './saida-pos-call';

const BASE: PosCall = {
  reuniao: {
    id: 'call-1',
    titulo: 'Descoberta',
    tipo: 'descoberta',
    status: 'concluida',
    agendadaPara: '2026-08-13T15:00:00.000Z',
    iniciadaEm: '2026-08-13T15:00:00.000Z',
    encerradaEm: '2026-08-13T15:30:00.000Z',
    duracaoMinutos: 30,
    liveCoachAtivo: true,
  },
  empresa: { nome: 'Clínica Horizonte', setor: 'Saúde', porte: 'Médio' },
  contato: { nome: 'Marina', cargo: 'Diretora' },
  oportunidade: {
    id: 'oportunidade-1',
    titulo: 'Atendimento',
    etapa: 'descoberta',
    proximaAcao: null,
    proximaAcaoEm: null,
  },
  analise: {
    status: 'concluida',
    resumo: 'Existe uma dor confirmada e abertura para avançar.',
    dores: [],
    objecoes: [],
    decisoes: [],
    compromissos: [],
    proximosPassos: [],
    oportunidadesProjeto: [],
    lacunas: [],
    sinaisCompra: [],
    briefingOperacional: null,
    sentimento: 'positivo',
    notaComercial: 80,
    erro: null,
    atualizadaEm: '2026-08-13T15:31:00.000Z',
  },
  transcricao: null,
  coach: [],
  sincronizacao: {
    historicoCrm: true,
    acoesPlano: [],
    projetoAtivo: null,
    propostaDaCall: null,
  },
};

describe('montarSaidaPosCall', () => {
  it('leva uma call comercial analisada para uma única proposta', () => {
    expect(montarSaidaPosCall(BASE)).toMatchObject({
      tipo: 'proposta',
      acao: 'Preparar proposta',
      href: '/propostas/nova?oportunidade=oportunidade-1&reuniao=call-1',
    });
  });

  it('reabre a proposta já conectada em vez de criar outra', () => {
    const posCall: PosCall = {
      ...BASE,
      sincronizacao: {
        ...BASE.sincronizacao,
        propostaDaCall: { id: 'proposta-1', titulo: 'Proposta · Atendimento', status: 'rascunho' },
      },
    };

    expect(montarSaidaPosCall(posCall)).toMatchObject({
      tipo: 'proposta',
      acao: 'Abrir proposta',
      href: '/propostas/proposta-1?origem=call',
    });
  });

  it('leva kickoff com briefing para o projeto ativo', () => {
    const posCall: PosCall = {
      ...BASE,
      reuniao: { ...BASE.reuniao, tipo: 'kickoff' },
      analise: {
        ...BASE.analise!,
        briefingOperacional: {
          objetivo: 'Publicar o piloto',
          criterio_sucesso: null,
          responsavel_cliente: null,
          responsavel_tecnico: null,
          acessos: [],
          limites: [],
          proximos_passos: [],
        },
      },
      sincronizacao: {
        ...BASE.sincronizacao,
        projetoAtivo: { id: 'projeto-1', titulo: 'Piloto de atendimento' },
      },
    };

    expect(montarSaidaPosCall(posCall)).toMatchObject({
      tipo: 'projeto',
      acao: 'Abrir projeto',
      href: '/solucoes/execucao/projeto-1#briefing-kickoff',
    });
  });

  it('mantém no CRM quando a análise ainda não sustenta proposta', () => {
    const posCall: PosCall = {
      ...BASE,
      reuniao: { ...BASE.reuniao, status: 'processando' },
      analise: null,
    };

    expect(montarSaidaPosCall(posCall)).toMatchObject({
      tipo: 'crm',
      acao: 'Abrir dossiê',
      href: '/crm/oportunidade-1',
    });
  });
});
