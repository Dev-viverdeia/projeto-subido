import { describe, expect, it } from 'vitest';
import type { DossieLead } from '@/lib/crm/queries';
import type { DadosRoteiroProjeto } from '@/lib/conteudo/queries';
import { montarDocumentoInicial } from './montar';
import { DocumentoPropostaSchema } from './schema';

const LEAD: DossieLead = {
  oportunidade: {
    id: '11111111-1111-4111-8111-111111111111',
    titulo: 'Automação do atendimento',
    etapa: 'descoberta',
    empresaId: '22222222-2222-4222-8222-222222222222',
    empresa: 'Clínica Horizonte',
    dominio: 'clinicahorizonte.com.br',
    enriquecidoEm: null,
    enriquecimentoStatus: 'concluido',
    contatoId: '33333333-3333-4333-8333-333333333333',
    contato: 'Marina Alves',
    contatoEmail: 'marina@clinicahorizonte.com.br',
    valorCentavos: 1_800_000,
    proximaAcao: null,
    proximaAcaoEm: null,
    ultimoFato: null,
    ultimoFatoEm: null,
    atualizadoEm: '2026-08-07T12:00:00Z',
    criadoEm: '2026-08-01T12:00:00Z',
  },
  empresa: {
    nome: 'Clínica Horizonte',
    dominio: 'clinicahorizonte.com.br',
    setor: 'Saúde',
    porte: 'Médio',
    cidade: 'São Paulo',
    estado: 'SP',
  },
  contato: {
    nome: 'Marina Alves',
    email: 'marina@clinicahorizonte.com.br',
    telefone: null,
    cargo: 'Diretora de Operações',
    linkedinUrl: null,
  },
  eventos: [],
  calls: [],
  acoesPlano: [],
  projetoAtivo: null,
  projetoRecente: null,
  propostaRecente: null,
  enriquecimentos: [
    {
      id: '44444444-4444-4444-8444-444444444444',
      status: 'concluido',
      dominio: 'clinicahorizonte.com.br',
      linkedinUrl: null,
      erro: null,
      solicitadoEm: '2026-08-07T12:00:00Z',
      concluidoEm: '2026-08-07T12:02:00Z',
      fontes: [],
      dossie: {
        resumo:
          'A clínica recebe um volume alto de mensagens e perde contexto nas trocas de turno.',
        empresa: {
          setor: 'Saúde',
          porte: 'Médio',
          cidade: 'São Paulo',
          estado: 'SP',
          modeloNegocio: 'Clínica particular',
        },
        fatos: [],
        hipoteses: [],
        oportunidades: [
          {
            titulo: 'Triagem assistida',
            impacto: 'Diminuir o tempo de primeira resposta e organizar cada solicitação.',
            porQueAgora: 'A demanda cresceu.',
            abertura: 'Como as mensagens são priorizadas hoje?',
          },
        ],
        perguntasDescoberta: [],
        proximaAcao: { acao: 'Validar o fluxo', porque: 'Define o escopo.' },
        alertas: [],
      },
    },
  ],
  totalCalls: 2,
};

const FASES_PROJETO = [
  ['entender', 'Entender'],
  ['preparar', 'Preparar'],
  ['construir', 'Construir'],
  ['validar', 'Validar'],
  ['entregar', 'Entregar'],
] as const;

const PROJETO: DadosRoteiroProjeto = {
  resultado: 'Atendimento organizado, rápido e mensurável.',
  clienteIdeal: 'Empresas com alto volume de atendimento.',
  entregavelFinal: 'Operação de atendimento assistida por IA',
  versao: 1,
  roteiro: {
    fundamentos: [],
    fases: FASES_PROJETO.map(([id, titulo], indice) => ({
      id,
      titulo,
      objetivo: `Objetivo completo da fase ${titulo} para orientar toda a implementação.`,
      passos: [
        {
          id: `passo-${indice}`,
          titulo: `Passo ${indice + 1}`,
          acao: 'Executar esta etapa seguindo o roteiro detalhado e registrar as evidências.',
          concluidoQuando: 'O resultado estiver validado com a pessoa responsável.',
          entregavel: `Entregável ${indice + 1}`,
          insumos: [],
          execucao: [],
        },
      ],
    })),
  },
};

describe('montagem inicial da proposta', () => {
  it('combina o diagnóstico do CRM com o projeto sem inventar investimento', () => {
    const documento = montarDocumentoInicial(LEAD, {
      tipo: 'catalogo',
      titulo: 'Atendimento com IA',
      resumo: 'Projeto guiado para estruturar uma operação de atendimento assistida por IA.',
      projeto: PROJETO,
    });

    expect(DocumentoPropostaSchema.safeParse(documento).success).toBe(true);
    expect(documento.cliente.empresa).toBe('Clínica Horizonte');
    expect(documento.desafio).toContain('perde contexto');
    expect(documento.objetivo).toContain('Diminuir o tempo');
    expect(documento.escopo).toHaveLength(5);
    expect(documento.investimento.valorCentavos).toBe(1_800_000);
  });

  it('preserva valor a definir quando o CRM não tem valor', () => {
    const documento = montarDocumentoInicial(
      { ...LEAD, oportunidade: { ...LEAD.oportunidade, valorCentavos: null } },
      { tipo: 'sem_base', titulo: 'Projeto personalizado de IA' },
    );
    expect(documento.investimento.valorCentavos).toBeNull();
  });

  it('prioriza fatos confirmados na call sem transformar hipótese em promessa', () => {
    const documento = montarDocumentoInicial(
      LEAD,
      { tipo: 'sem_base', titulo: 'Projeto personalizado de IA' },
      {
        resumo: 'A recepção confirmou perda de contexto e demora na primeira resposta.',
        dores: ['Mensagens ficam sem responsável durante a troca de turno.'],
        objecoes: ['A equipe ainda precisa validar o uso durante o plantão.'],
        decisoes: ['O piloto ficará restrito a uma unidade.'],
        compromissos: ['Marina enviará uma amostra anonimizada das conversas.'],
        proximosPassos: ['Validar a amostra com a supervisora da recepção.'],
        lacunas: ['Quem aprova a entrada em produção?'],
      },
    );

    expect(documento.desafio).toContain('perda de contexto');
    expect(documento.desafio).not.toContain('Dores explicitadas');
    expect(documento.observacoes).toContain('O piloto ficará restrito');
    expect(documento.observacoes).toContain('Pontos a validar antes do início');
    expect(documento.observacoes).toContain('Quem aprova a entrada em produção');
    expect(documento.observacoes).toContain('Próximos passos acordados');
    expect(documento.objetivo).not.toContain('promessa');
  });

  it('usa somente falhas observadas e ações do diagnóstico no rascunho', () => {
    const documento = montarDocumentoInicial(
      LEAD,
      { tipo: 'sem_base', titulo: 'Projeto personalizado de IA' },
      null,
      {
        resumo: 'O acesso ao atendimento é claro, mas a conversa termina sem próximo passo.',
        falhas: ['A conversa não registra responsável nem prazo de retorno.'],
        plano: ['Definir responsável e prazo para cada categoria de solicitação.'],
      },
    );

    expect(documento.desafio).toContain('termina sem próximo passo');
    expect(documento.desafio).not.toContain('Falhas observadas');
    expect(documento.observacoes).toContain('Definir responsável');
  });
});
