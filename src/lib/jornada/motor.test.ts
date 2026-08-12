import { describe, expect, it } from 'vitest';
import { montarPlanoJornada, type SinaisJornada } from './motor';

function sinais(v: Partial<SinaisJornada> = {}): SinaisJornada {
  return {
    perfil: null,
    aprendizado: {
      aulasConcluidas: 0,
      formacoesConcluidas: 0,
      etapasConcluidas: 0,
      projetosConcluidos: 0,
    },
    oportunidades: { total: 0, comProximaAcao: 0, ganhas: 0 },
    calls: { descobertasConcluidas: 0, kickoffsConcluidos: 0, entregasConcluidas: 0 },
    diagnosticosConcluidos: 0,
    propostas: { total: 0, apresentadas: 0, aceitas: 0 },
    ...v,
  };
}

const perfil = {
  nicho: 'Clínicas',
  projetoInicialId: 'projeto-1',
  projetoInicialTitulo: 'Atendimento com IA',
  projetoInicialSlug: 'atendimento-com-ia',
  posicionamento: 'Implanto atendimento com IA para clínicas reduzirem o tempo de resposta.',
  atualizadoEm: '2026-08-08T12:00:00.000Z',
};

describe('motor da jornada', () => {
  it('começa pela escolha declarada quando não existem fatos', () => {
    const plano = montarPlanoJornada(sinais());

    expect(plano.etapaAtual).toBe('aprender');
    expect(plano.proximoPasso.id).toBe('projeto-inicial');
    expect(plano.percentual).toBe(0);
    expect(plano.perfilCompleto).toBe(false);
  });

  it('direciona para a formação depois que a primeira oferta foi definida', () => {
    const plano = montarPlanoJornada(sinais({ perfil }));

    expect(plano.etapaAtual).toBe('aprender');
    expect(plano.proximoPasso.id).toBe('formacao-base');
  });

  it('avança para prospecção somente depois de oferta e posicionamento', () => {
    const plano = montarPlanoJornada(
      sinais({
        perfil,
        aprendizado: {
          aulasConcluidas: 12,
          formacoesConcluidas: 1,
          etapasConcluidas: 0,
          projetosConcluidos: 0,
        },
      }),
    );

    expect(plano.etapaAtual).toBe('prospectar');
    expect(plano.proximoPasso.id).toBe('primeiro-lead');
    expect(plano.etapas[0]?.status).toBe('concluida');
  });

  it('não confunde proposta criada com venda confirmada', () => {
    const plano = montarPlanoJornada(
      sinais({
        perfil,
        aprendizado: {
          aulasConcluidas: 12,
          formacoesConcluidas: 1,
          etapasConcluidas: 0,
          projetosConcluidos: 0,
        },
        oportunidades: { total: 1, comProximaAcao: 1, ganhas: 0 },
        calls: { descobertasConcluidas: 1, kickoffsConcluidos: 0, entregasConcluidas: 0 },
        diagnosticosConcluidos: 1,
        propostas: { total: 1, apresentadas: 1, aceitas: 0 },
      }),
    );

    expect(plano.etapaAtual).toBe('vender');
    expect(plano.proximoPasso.id).toBe('venda-confirmada');
  });

  it('prioriza a prospecção existente mesmo com formação pendente', () => {
    const plano = montarPlanoJornada(
      sinais({
        perfil,
        oportunidades: { total: 1, comProximaAcao: 1, ganhas: 0 },
      }),
    );

    expect(plano.etapaAtual).toBe('prospectar');
    expect(plano.proximoPasso.id).toBe('descoberta');
  });

  it('leva uma venda aceita direto para o kickoff da entrega', () => {
    const plano = montarPlanoJornada(
      sinais({
        perfil,
        oportunidades: { total: 1, comProximaAcao: 1, ganhas: 1 },
        propostas: { total: 1, apresentadas: 1, aceitas: 1 },
      }),
    );

    expect(plano.etapaAtual).toBe('entregar');
    expect(plano.proximoPasso.id).toBe('kickoff');
  });

  it('só entra em evolução depois de kickoff e validação da entrega', () => {
    const plano = montarPlanoJornada(
      sinais({
        perfil,
        aprendizado: {
          aulasConcluidas: 12,
          formacoesConcluidas: 1,
          etapasConcluidas: 15,
          projetosConcluidos: 1,
        },
        oportunidades: { total: 2, comProximaAcao: 1, ganhas: 1 },
        calls: { descobertasConcluidas: 1, kickoffsConcluidos: 1, entregasConcluidas: 1 },
        diagnosticosConcluidos: 1,
        propostas: { total: 1, apresentadas: 1, aceitas: 1 },
      }),
    );

    expect(plano.etapaAtual).toBe('evoluir');
    expect(plano.proximoPasso.id).toBe('segunda-venda');
  });
});
