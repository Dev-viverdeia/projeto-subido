import type { DocumentoSolucao } from '@/lib/builder/schema';
import type { DossieLead } from '@/lib/crm/queries';
import type { DadosRoteiroProjeto } from '@/lib/conteudo/queries';
import { DocumentoPropostaSchema, type DocumentoProposta } from './schema';

type OrigemCatalogo = {
  tipo: 'catalogo';
  titulo: string;
  resumo: string;
  projeto: DadosRoteiroProjeto;
};

type OrigemEstudio = {
  tipo: 'estudio';
  titulo: string;
  documento: DocumentoSolucao;
};

type OrigemSemBase = { tipo: 'sem_base'; titulo: string };

export type OrigemProposta = OrigemCatalogo | OrigemEstudio | OrigemSemBase;

export type ContextoPosCallProposta = {
  resumo: string;
  dores: string[];
  decisoes: string[];
  compromissos: string[];
};

export type ContextoDiagnosticoProposta = {
  resumo: string;
  falhas: string[];
  plano: string[];
};

const TITULOS_FASE: Record<number, string> = {
  1: 'Fundação',
  2: 'Construção',
  3: 'Validação',
};

function unicos(valores: string[], limite: number): string[] {
  return [...new Set(valores.map((valor) => valor.trim()).filter(Boolean))].slice(0, limite);
}

function limitar(valor: string, maximo: number): string {
  return valor.trim().slice(0, maximo);
}

function ultimaLeitura(lead: DossieLead) {
  return lead.enriquecimentos.find((execucao) => execucao.status === 'concluido' && execucao.dossie)
    ?.dossie;
}

function baseCatalogo(origem: OrigemCatalogo) {
  const fases = origem.projeto.roteiro.fases;
  return {
    projeto: {
      titulo: origem.titulo,
      resumo: origem.resumo,
      origem: 'catalogo' as const,
    },
    objetivo: origem.projeto.resultado,
    escopo: fases.map((fase) => ({ titulo: fase.titulo, descricao: fase.objetivo })),
    entregaveis: unicos(
      [
        origem.projeto.entregavelFinal,
        ...fases.flatMap((fase) => fase.passos.map((passo) => passo.entregavel)),
      ],
      8,
    ),
    cronograma: fases.map((fase) => ({
      fase: fase.titulo,
      duracao: 'A combinar',
      descricao: fase.objetivo,
    })),
  };
}

function baseEstudio(origem: OrigemEstudio) {
  const fases = [1, 2, 3]
    .map((numero) => {
      const etapas = origem.documento.etapas.filter((etapa) => (etapa.fase ?? 2) === numero);
      if (!etapas.length) return null;
      return {
        fase: TITULOS_FASE[numero] ?? `Fase ${numero}`,
        duracao: 'A combinar',
        descricao: limitar(etapas.map((etapa) => etapa.titulo).join(' · '), 600),
      };
    })
    .filter((fase): fase is NonNullable<typeof fase> => Boolean(fase));

  return {
    projeto: {
      titulo: origem.titulo,
      resumo: origem.documento.resumo,
      origem: 'estudio' as const,
    },
    objetivo: origem.documento.resumo,
    escopo: origem.documento.etapas.slice(0, 10).map((etapa) => ({
      titulo: etapa.titulo,
      descricao: etapa.descricao,
    })),
    entregaveis: unicos(
      origem.documento.etapas.map((etapa) => etapa.titulo),
      8,
    ),
    cronograma: fases.length
      ? fases
      : [
          {
            fase: 'Implementação',
            duracao: 'A combinar',
            descricao: 'Construção, validação e entrega da solução personalizada.',
          },
        ],
  };
}

function baseSemProjeto(origem: OrigemSemBase) {
  return {
    projeto: {
      titulo: origem.titulo,
      resumo: 'Projeto personalizado a partir do diagnóstico comercial do cliente.',
      origem: 'sem_base' as const,
    },
    objetivo: 'Construir uma solução de IA alinhada ao problema e ao resultado esperado.',
    escopo: [
      {
        titulo: 'Diagnóstico e desenho',
        descricao: 'Validar o problema, definir a solução e fechar os critérios de sucesso.',
      },
      {
        titulo: 'Implementação',
        descricao: 'Construir, testar e ajustar o fluxo definido em conjunto com o cliente.',
      },
      {
        titulo: 'Entrega e capacitação',
        descricao: 'Entregar a solução validada e orientar as pessoas responsáveis pela operação.',
      },
    ],
    entregaveis: ['Solução configurada e validada', 'Documentação de uso', 'Sessão de entrega'],
    cronograma: [
      {
        fase: 'Implementação',
        duracao: 'A combinar',
        descricao: 'Diagnóstico, construção, validação e entrega.',
      },
    ],
  };
}

export function montarDocumentoInicial(
  lead: DossieLead,
  origem: OrigemProposta,
  posCall?: ContextoPosCallProposta | null,
  diagnostico?: ContextoDiagnosticoProposta | null,
): DocumentoProposta {
  const leitura = ultimaLeitura(lead);
  const base =
    origem.tipo === 'catalogo'
      ? baseCatalogo(origem)
      : origem.tipo === 'estudio'
        ? baseEstudio(origem)
        : baseSemProjeto(origem);

  const oportunidade = leitura?.oportunidades[0];
  // A proposta precisa abrir com uma leitura comercial curta. As listas detalhadas
  // continuam no dossiê e no pós-call; despejá-las aqui repetia o resumo, criava
  // pontuação quebrada e obrigava o profissional a limpar o documento antes de vender.
  const contextoDaCall = posCall ? limitar(posCall.resumo, 900) : null;
  const contextoDoDiagnostico = diagnostico ? limitar(diagnostico.resumo, 900) : null;
  const desafio =
    contextoDaCall ??
    contextoDoDiagnostico ??
    leitura?.resumo ??
    `A ${lead.empresa.nome} busca avançar em ${lead.oportunidade.titulo.toLowerCase()}, com um processo claro, mensurável e seguro.`;
  const objetivo = oportunidade?.impacto ?? base.objetivo;
  const confirmacoes = posCall ? unicos([...posCall.decisoes, ...posCall.compromissos], 5) : [];
  const planoDiagnostico = diagnostico ? unicos(diagnostico.plano, 4) : [];
  const observacoes = [
    confirmacoes.length
      ? `Pontos confirmados na reunião:\n${confirmacoes.map((item) => `• ${item}`).join('\n')}`
      : null,
    planoDiagnostico.length
      ? `Ações indicadas pelo diagnóstico para validação:\n${planoDiagnostico.map((item) => `• ${item}`).join('\n')}`
      : null,
  ]
    .filter(Boolean)
    .join('\n\n');

  return DocumentoPropostaSchema.parse({
    cliente: {
      empresa: lead.empresa.nome,
      contato: lead.contato?.nome ?? null,
      cargo: lead.contato?.cargo ?? null,
      email:
        lead.contato?.email && /^\S+@\S+\.\S+$/.test(lead.contato.email)
          ? lead.contato.email
          : null,
    },
    projeto: base.projeto,
    desafio: limitar(desafio, 4000),
    objetivo: limitar(objetivo, 2000),
    escopo: base.escopo,
    entregaveis: base.entregaveis,
    cronograma: base.cronograma,
    investimento: {
      valorCentavos: lead.oportunidade.valorCentavos,
      condicoes: 'Condições de pagamento a combinar após a validação final do escopo.',
    },
    validadeDias: 15,
    proximosPassos: [
      'Validar escopo, cronograma e responsáveis.',
      'Aprovar esta proposta comercial.',
      'Realizar a reunião de início do projeto.',
    ],
    observacoes: observacoes ? limitar(observacoes, 3000) : null,
  });
}
