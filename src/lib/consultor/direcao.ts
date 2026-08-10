import { z } from 'zod';

export const EtapaSobralSchema = z.enum([
  'aprender',
  'prospectar',
  'vender',
  'entregar',
  'evoluir',
]);

export type EtapaSobral = z.infer<typeof EtapaSobralSchema>;

export const DestinoSobralSchema = z.enum([
  '/formacoes',
  '/solucoes',
  '/crm',
  '/calls',
  '/propostas',
  '/propostas/nova',
  '/builder',
  '/mentorias',
]);

export const AcaoSobralSchema = z.object({
  titulo: z.string().trim().min(5).max(120),
  detalhe: z.string().trim().min(15).max(420),
  evidencia: z.string().trim().min(8).max(240),
  destino: DestinoSobralSchema,
});

export type AcaoSobral = z.infer<typeof AcaoSobralSchema>;

/** Contrato devolvido pelo modelo. A etapa não entra: ela pertence aos fatos. */
export const RespostaEstruturadaSobralSchema = z.object({
  resposta: z.string().trim().min(20).max(3000),
  diagnostico: z.string().trim().min(20).max(1200),
  foco: z.string().trim().min(3).max(180),
  proximo_passo: AcaoSobralSchema,
  acoes: z.array(AcaoSobralSchema).length(3),
});

export type RespostaEstruturadaSobral = z.infer<typeof RespostaEstruturadaSobralSchema>;

export const ContextoAcaoCrmSchema = z.object({
  oportunidade_id: z.uuid(),
  empresa: z.string().trim().min(1).max(160),
  acao_sugerida: z.string().trim().min(3).max(500),
  acao_atual: z.string().trim().max(500).nullable(),
  prazo_atual: z.string().nullable(),
});

export type ContextoAcaoCrm = z.infer<typeof ContextoAcaoCrmSchema>;

export const AcaoConfirmadaCrmSchema = z.object({
  acao: z.string().trim().min(3).max(500),
  quando: z.string().nullable(),
  confirmada_em: z.string(),
});

export type AcaoConfirmadaCrm = z.infer<typeof AcaoConfirmadaCrmSchema>;

export const DirecaoMensagemSchema = z.object({
  etapa: EtapaSobralSchema,
  diagnostico: z.string().trim().min(20).max(1200),
  foco: z.string().trim().min(3).max(180),
  proximo_passo: AcaoSobralSchema,
  acoes: z.array(AcaoSobralSchema).min(1).max(3),
  gerado_em: z.string(),
  contexto_acao: ContextoAcaoCrmSchema.nullable().optional(),
});

export type DirecaoMensagem = z.infer<typeof DirecaoMensagemSchema>;

export const PlanoSobralSchema = z.object({
  etapa: EtapaSobralSchema,
  diagnostico: z.string().trim().min(20).max(1200),
  foco: z.string().trim().min(3).max(180),
  proximoPasso: AcaoSobralSchema,
  acoes: z.array(AcaoSobralSchema).min(1).max(3),
  sinais: z.record(z.string(), z.unknown()),
  modelo: z.string().min(2).max(120),
  geradoEm: z.string(),
});

export type PlanoSobral = z.infer<typeof PlanoSobralSchema>;

const FocoSchema = z
  .object({
    oportunidadeId: z.uuid(),
    titulo: z.string(),
    empresa: z.string(),
    etapa: z.string(),
    proximaAcao: z.string().nullable(),
    proximaAcaoEm: z.string().nullable(),
  })
  .nullable();

export const SinaisSobralSchema = z.object({
  momento: z.string(),
  oportunidades: z.object({
    total: z.number().int().nonnegative(),
    abertas: z.number().int().nonnegative(),
    semProximaAcao: z.number().int().nonnegative(),
    emDescoberta: z.number().int().nonnegative(),
    emPropostaOuNegociacao: z.number().int().nonnegative(),
    ganhas: z.number().int().nonnegative(),
  }),
  calls: z.object({
    total: z.number().int().nonnegative(),
    agendadas: z.number().int().nonnegative(),
    concluidas: z.number().int().nonnegative(),
  }),
  propostas: z.object({
    total: z.number().int().nonnegative(),
    rascunhos: z.number().int().nonnegative(),
    prontas: z.number().int().nonnegative(),
    apresentadas: z.number().int().nonnegative(),
    aceitas: z.number().int().nonnegative(),
  }),
  studio: z.object({
    total: z.number().int().nonnegative(),
    prontos: z.number().int().nonnegative(),
  }),
  projetos: z.object({
    total: z.number().int().nonnegative(),
    ativos: z.number().int().nonnegative(),
    acoesPendentes: z.number().int().nonnegative(),
    acoesAtrasadas: z.number().int().nonnegative(),
  }),
  radar: z
    .array(
      z.object({
        id: z.string().min(3),
        dominio: z.enum(['crm', 'calls', 'propostas', 'projetos', 'plano']),
        titulo: z.string().trim().min(3).max(180),
        contexto: z.string().trim().min(2).max(240),
        momento: z.string().trim().min(2).max(120),
        estado: z.enum(['ao_vivo', 'atrasado', 'hoje', 'agendado', 'aguardando', 'sem_prazo']),
        destino: z.string().startsWith('/'),
        prioridade: z.number().int().nonnegative(),
      }),
    )
    .max(4),
  catalogo: z.array(
    z.object({ slug: z.string(), titulo: z.string(), categoria: z.string().nullable() }),
  ),
  foco: FocoSchema,
});

export type SinaisSobral = z.infer<typeof SinaisSobralSchema>;

export const ETAPAS_SOBRAL: ReadonlyArray<{
  id: EtapaSobral;
  numero: string;
  titulo: string;
  marco: string;
}> = [
  { id: 'aprender', numero: '01', titulo: 'Aprender', marco: 'Escolher uma entrega inicial' },
  {
    id: 'prospectar',
    numero: '02',
    titulo: 'Prospectar',
    marco: 'Criar e qualificar oportunidades',
  },
  { id: 'vender', numero: '03', titulo: 'Vender', marco: 'Apresentar uma proposta clara' },
  { id: 'entregar', numero: '04', titulo: 'Entregar', marco: 'Executar com evidência' },
  { id: 'evoluir', numero: '05', titulo: 'Evoluir', marco: 'Transformar experiência em método' },
];

/**
 * A etapa é consequência de registros verificáveis. O modelo recebe o resultado
 * e não tem permissão para promovê-lo por retórica.
 */
export function detectarEtapaSobral(sinais: SinaisSobral): EtapaSobral {
  const entregasComprovadas = Math.max(sinais.oportunidades.ganhas, sinais.propostas.aceitas);

  if (entregasComprovadas >= 2) return 'evoluir';
  if (entregasComprovadas >= 1) return 'entregar';
  if (sinais.propostas.total > 0 || sinais.oportunidades.emPropostaOuNegociacao > 0) {
    return 'vender';
  }
  if (sinais.oportunidades.total > 0 || sinais.calls.total > 0) return 'prospectar';
  return 'aprender';
}

export function indiceDaEtapa(etapa: EtapaSobral): number {
  return ETAPAS_SOBRAL.findIndex((item) => item.id === etapa);
}

function acao(
  titulo: string,
  detalhe: string,
  evidencia: string,
  destino: AcaoSobral['destino'],
): AcaoSobral {
  return { titulo, detalhe, evidencia, destino };
}

/** Direção imediata enquanto ainda não há uma leitura gerada pela OpenAI. */
export function criarPlanoBase(sinais: SinaisSobral): PlanoSobral {
  const etapa = detectarEtapaSobral(sinais);
  const empresa = sinais.foco?.empresa;
  const agora = sinais.momento;

  if (etapa === 'aprender') {
    const acoes = [
      acao(
        'Escolha uma entrega para dominar',
        'Abra os projetos padrão e escolha aquele cujo problema você consegue explicar com clareza para uma empresa.',
        'Um projeto padrão escolhido como sua oferta inicial.',
        '/solucoes',
      ),
      acao(
        'Conclua a base necessária',
        'Faça apenas a formação que sustenta a entrega escolhida e anote as dúvidas que impediriam uma implementação real.',
        'Formação essencial concluída e dúvidas registradas.',
        '/formacoes',
      ),
      acao(
        'Transforme estudo em conversa',
        'Escreva em uma frase o problema, para quem ele aparece e qual resultado observável o projeto entrega.',
        'Uma frase de posicionamento que não depende de jargão técnico.',
        '/formacoes',
      ),
    ];
    return {
      etapa,
      diagnostico:
        'Ainda não existem fatos comerciais na plataforma. O melhor avanço é sair do aprendizado amplo com uma entrega concreta em mãos.',
      foco: 'Escolher a primeira entrega',
      proximoPasso: acoes[0]!,
      acoes,
      sinais,
      modelo: 'regra-factual-v1',
      geradoEm: agora,
    };
  }

  if (etapa === 'prospectar') {
    const semAcao = sinais.oportunidades.semProximaAcao > 0;
    const semCall = sinais.calls.agendadas === 0 && sinais.calls.concluidas === 0;
    const principal = semAcao
      ? acao(
          `Defina a próxima ação${empresa ? ` de ${empresa}` : ''}`,
          'Registre no CRM uma ação com verbo, responsável e data. O lead não pode depender da sua memória para avançar.',
          'Próxima ação e data visíveis na oportunidade.',
          '/crm',
        )
      : semCall
        ? acao(
            `Agende a descoberta${empresa ? ` com ${empresa}` : ''}`,
            'Use a call para confirmar processo atual, volume, impacto e quem decide. Não apresente solução antes desses fatos.',
            'Call de descoberta vinculada à oportunidade.',
            '/calls',
          )
        : acao(
            `Prepare a próxima conversa${empresa ? ` de ${empresa}` : ''}`,
            'Revise o dossiê e transforme as lacunas em perguntas que mudariam escopo, prazo ou viabilidade.',
            'Roteiro de descoberta com perguntas específicas.',
            '/crm',
          );
    const acoes = [
      principal,
      acao(
        'Complete o contexto do lead',
        'Enriqueça apenas os dados que ajudam a decidir abordagem, diagnóstico ou entrega.',
        'Dossiê do lead com fontes e lacunas explícitas.',
        '/crm',
      ),
      acao(
        'Conduza uma descoberta factual',
        'Use a sala de calls para registrar a conversa e transformar compromissos em fatos do CRM.',
        'Call vinculada e próxima ação registrada.',
        '/calls',
      ),
    ];
    return {
      etapa,
      diagnostico: `${sinais.oportunidades.abertas} oportunidade(s) aberta(s). O avanço agora depende de converter contexto em uma conversa e uma próxima ação rastreável.`,
      foco: empresa ? `Avançar ${empresa}` : 'Criar uma descoberta com contexto',
      proximoPasso: principal,
      acoes,
      sinais,
      modelo: 'regra-factual-v1',
      geradoEm: agora,
    };
  }

  if (etapa === 'vender') {
    const principal =
      sinais.propostas.total === 0
        ? acao(
            `Monte a proposta${empresa ? ` de ${empresa}` : ''}`,
            'Converta os fatos da descoberta em escopo, entregáveis, prazo, investimento e decisão esperada.',
            'Proposta comercial criada e vinculada à oportunidade.',
            '/propostas/nova',
          )
        : sinais.propostas.prontas > 0
          ? acao(
              'Apresente a proposta em uma conversa',
              'Conduza a decisão ao vivo, confirme critérios e registre objeções antes de enviar qualquer ajuste.',
              'Proposta marcada como apresentada e follow-up agendado.',
              '/propostas',
            )
          : acao(
              'Conclua a proposta em aberto',
              'Feche escopo, fronteiras e evidência de sucesso antes de mudar o documento para pronto.',
              'Proposta com todos os blocos revisados e status pronta.',
              '/propostas',
            );
    const acoes = [
      principal,
      acao(
        'Valide o escopo contra os fatos',
        'Confira se cada entregável responde a uma dor registrada e se toda premissa ainda não confirmada está explícita.',
        'Entregáveis ligados aos fatos da descoberta.',
        '/crm',
      ),
      acao(
        'Prepare o próximo compromisso',
        'Defina o que o cliente precisa decidir, quem precisa participar e qual data encerra o próximo passo.',
        'Reunião ou follow-up registrado no CRM.',
        '/calls',
      ),
    ];
    return {
      etapa,
      diagnostico: `${sinais.propostas.total} proposta(s) em curso. A prioridade é reduzir ambiguidade e conduzir uma decisão, não produzir mais documentos.`,
      foco: empresa ? `Conduzir a decisão de ${empresa}` : 'Conduzir a proposta até uma decisão',
      proximoPasso: principal,
      acoes,
      sinais,
      modelo: 'regra-factual-v1',
      geradoEm: agora,
    };
  }

  if (etapa === 'entregar') {
    const acoes = [
      acao(
        'Abra o projeto de implementação',
        'Escolha o projeto vendido e execute a primeira fase com responsáveis, acessos e critérios de aceite definidos.',
        'Plano de implementação iniciado com primeiro entregável validável.',
        '/solucoes',
      ),
      acao(
        'Congele escopo e sucesso',
        'Registre o que será entregue, o que fica fora e qual evidência o cliente aceitará como conclusão.',
        'Escopo e critérios de aceite confirmados pelo cliente.',
        '/propostas',
      ),
      acao(
        'Marque a cadência de validação',
        'Agende checkpoints curtos para mostrar evidência real e corrigir cedo, antes da entrega final.',
        'Próxima revisão de implementação agendada.',
        '/calls',
      ),
    ];
    return {
      etapa,
      diagnostico:
        'Há uma venda comprovada. O risco agora é perder a clareza da proposta durante a execução; a entrega precisa avançar por evidências pequenas e frequentes.',
      foco: empresa
        ? `Entregar valor para ${empresa}`
        : 'Executar a primeira entrega com evidência',
      proximoPasso: acoes[0]!,
      acoes,
      sinais,
      modelo: 'regra-factual-v1',
      geradoEm: agora,
    };
  }

  const acoes = [
    acao(
      'Documente o método que se repetiu',
      'Compare as entregas concluídas e registre decisões, ativos e verificações que podem virar padrão.',
      'Playbook revisado com passos e critérios reutilizáveis.',
      '/builder',
    ),
    acao(
      'Transforme resultado em prova',
      'Registre antes, depois, premissas e depoimento autorizado sem prometer que todo cliente terá o mesmo resultado.',
      'Caso documentado com evidências e autorização de uso.',
      '/crm',
    ),
    acao(
      'Escolha o próximo gargalo',
      'Leve seus dados para a mentoria e decida se o próximo ciclo deve melhorar venda, entrega ou capacidade.',
      'Um único gargalo priorizado para o próximo ciclo.',
      '/mentorias',
    ),
  ];
  return {
    etapa,
    diagnostico:
      'Mais de uma entrega foi comprovada. O próximo ganho vem de transformar decisões recorrentes em método, prova e previsibilidade.',
    foco: 'Transformar experiência em método',
    proximoPasso: acoes[0]!,
    acoes,
    sinais,
    modelo: 'regra-factual-v1',
    geradoEm: agora,
  };
}
