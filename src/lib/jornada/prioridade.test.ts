import { describe, expect, it } from 'vitest';
import { SinaisSobralSchema, type SinaisSobral } from '@/lib/consultor/direcao';
import { montarPlanoJornada, type SinaisJornada } from './motor';
import { resolverPrioridadeInicio } from './prioridade';

function jornada(alteracoes: Partial<SinaisJornada> = {}) {
  return montarPlanoJornada({
    perfil: {
      nicho: 'Clínicas',
      projetoInicialId: 'projeto-1',
      projetoInicialTitulo: 'Atendimento com IA',
      projetoInicialSlug: 'atendimento-com-ia',
      posicionamento: 'Implanto atendimento com IA para clínicas reduzirem o tempo de resposta.',
      atualizadoEm: '2026-08-13T12:00:00.000Z',
    },
    aprendizado: {
      aulasConcluidas: 12,
      formacoesConcluidas: 1,
      etapasConcluidas: 0,
      projetosConcluidos: 0,
    },
    oportunidades: { total: 0, enriquecidas: 0, comProximaAcao: 0, ganhas: 0 },
    calls: { descobertasConcluidas: 0, kickoffsConcluidos: 0, entregasConcluidas: 0 },
    propostas: { total: 0, apresentadas: 0, aceitas: 0 },
    entregas: {
      projetosIniciados: 0,
      projetosConcluidos: 0,
      propostaAceitaEmFocoId: null,
      projetoEmFocoId: null,
      projetoEmFocoTitulo: null,
      tarefasConcluidas: 0,
      tarefasTotal: 0,
    },
    ...alteracoes,
  });
}

function sobral(radar: SinaisSobral['radar'] = []): SinaisSobral {
  return SinaisSobralSchema.parse({
    momento: '2026-08-13T12:00:00.000Z',
    oportunidades: {
      total: 0,
      abertas: 0,
      semProximaAcao: 0,
      emDescoberta: 0,
      emPropostaOuNegociacao: 0,
      ganhas: 0,
    },
    calls: { total: 0, agendadas: 0, concluidas: 0 },
    propostas: { total: 0, rascunhos: 0, prontas: 0, apresentadas: 0, aceitas: 0 },
    studio: { total: 0, prontos: 0 },
    projetos: { total: 0, ativos: 0, acoesPendentes: 0, acoesAtrasadas: 0 },
    radar,
    catalogo: [],
    foco: null,
  });
}

describe('prioridade oficial da Início', () => {
  it('usa o próximo marco da jornada quando não existe urgência operacional', () => {
    const prioridade = resolverPrioridadeInicio(jornada(), sobral());

    expect(prioridade.modo).toBe('plano da jornada');
    expect(prioridade.titulo).toBe('Criar a primeira oportunidade');
    expect(prioridade.destino).toBe('/crm');
  });

  it('abre o registro exato quando o próximo marco já tem contexto no radar', () => {
    const prioridade = resolverPrioridadeInicio(
      jornada({
        oportunidades: { total: 1, enriquecidas: 0, comProximaAcao: 0, ganhas: 0 },
      }),
      sobral([
        {
          id: 'crm-oportunidade-1',
          dominio: 'crm',
          titulo: 'Definir a próxima ação',
          contexto: 'Clínica Aurora · Novo lead',
          momento: 'Sem próxima ação',
          estado: 'sem_prazo',
          destino: '/crm/oportunidade-1',
          prioridade: 92,
        },
      ]),
    );

    expect(prioridade.titulo).toBe('Completar o contexto do lead');
    expect(prioridade.destino).toBe('/crm/oportunidade-1');
  });

  it('faz uma urgência factual vencer o próximo marco planejado', () => {
    const prioridade = resolverPrioridadeInicio(
      jornada(),
      sobral([
        {
          id: 'calls-call-1',
          dominio: 'calls',
          titulo: 'Descoberta com Clínica Aurora',
          contexto: 'Clínica Aurora · Descoberta',
          momento: 'Ao vivo agora',
          estado: 'ao_vivo',
          destino: '/calls/call-1',
          prioridade: 142,
        },
      ]),
    );

    expect(prioridade.modo).toBe('prioridade da operação');
    expect(prioridade.titulo).toBe('Descoberta com Clínica Aurora');
    expect(prioridade.destino).toBe('/calls/call-1');
  });

  it('abre o formulário de call já vinculado ao lead em foco', () => {
    const prioridade = resolverPrioridadeInicio(
      jornada({
        oportunidades: { total: 1, enriquecidas: 1, comProximaAcao: 1, ganhas: 0 },
      }),
      SinaisSobralSchema.parse({
        ...sobral(),
        oportunidades: {
          total: 1,
          abertas: 1,
          semProximaAcao: 0,
          emDescoberta: 0,
          emPropostaOuNegociacao: 0,
          ganhas: 0,
        },
        foco: {
          oportunidadeId: '11111111-1111-4111-8111-111111111111',
          titulo: 'Atendimento da Clínica Aurora',
          empresa: 'Clínica Aurora',
          etapa: 'qualificacao',
          proximaAcao: 'Agendar descoberta',
          proximaAcaoEm: null,
        },
      }),
    );

    expect(prioridade.titulo).toBe('Concluir a descoberta');
    expect(prioridade.destino).toBe(
      '/calls?nova=1&oportunidade=11111111-1111-4111-8111-111111111111',
    );
  });
});
