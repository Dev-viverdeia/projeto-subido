import { z } from 'zod';
import { EtapaSobralSchema, type EtapaSobral } from './etapas';
import { alinharAcoesComJornada } from './jornada-plano';
import { EventoAcaoCrmSchema, RecomendacaoProximaAcaoSchema } from './recomendacao';
import type { SinaisSobral } from './sinais';

export { ETAPAS_SOBRAL, EtapaSobralSchema, indiceDaEtapa, type EtapaSobral } from './etapas';
export { SinaisSobralSchema, type SinaisSobral } from './sinais';

const DestinoSobralAtualSchema = z.enum([
  '/inicio',
  '/formacoes',
  '/solucoes',
  '/vendas',
  '/reunioes',
  '/propostas',
  '/propostas/nova',
  '/builder',
  '/mentorias',
]);

/** Mantém legíveis os planos já salvos antes da simplificação dos nomes. */
export const DestinoSobralSchema = z.preprocess(
  (valor) => (valor === '/crm' ? '/vendas' : valor === '/calls' ? '/reunioes' : valor),
  DestinoSobralAtualSchema,
);

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

export const AcaoConfirmadaCrmSchema = z
  .object({
    acao: z.string().trim().min(3).max(500),
    quando: z.string().nullable(),
    confirmada_em: z.string(),
    atualizado_em: z.string(),
    status: z.enum(['pendente', 'concluida']),
    concluida_em: z.string().nullable(),
    historico: z.array(EventoAcaoCrmSchema),
    recomendacao: RecomendacaoProximaAcaoSchema.nullable().default(null),
  })
  .superRefine((acao, contexto) => {
    if (acao.status === 'concluida' && !acao.concluida_em) {
      contexto.addIssue({
        code: 'custom',
        path: ['concluida_em'],
        message: 'Uma ação concluída precisa registrar quando foi encerrada.',
      });
    }
    if (acao.status === 'pendente' && acao.concluida_em) {
      contexto.addIssue({
        code: 'custom',
        path: ['concluida_em'],
        message: 'Uma ação pendente não pode ter data de conclusão.',
      });
    }
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

/**
 * A etapa é consequência de registros verificáveis. O modelo recebe o resultado
 * e não tem permissão para promovê-lo por retórica.
 */
export function detectarEtapaSobral(sinais: SinaisSobral): EtapaSobral {
  return sinais.jornada.etapaAtual;
}

function acao(
  titulo: string,
  detalhe: string,
  evidencia: string,
  destino: AcaoSobral['destino'],
): AcaoSobral {
  return { titulo, detalhe, evidencia, destino };
}

function quantidade(valor: number, singular: string, plural: string): string {
  return `${valor} ${valor === 1 ? singular : plural}`;
}

/** Plano inicial enquanto ainda não há uma leitura gerada pela OpenAI. */
export function criarPlanoBase(sinais: SinaisSobral): PlanoSobral {
  const etapa = detectarEtapaSobral(sinais);
  const empresa = sinais.foco?.empresa;
  const agora = sinais.momento;

  if (etapa === 'aprender') {
    const acoes = alinharAcoesComJornada(sinais, [
      acao(
        'Conclua a primeira formação',
        'Aprenda os fundamentos para entender como vender e implementar um projeto de IA.',
        'Primeira formação concluída na plataforma.',
        '/formacoes',
      ),
      acao(
        'Execute um projeto guiado',
        'Escolha um projeto e siga o passo a passo até compreender a entrega para o cliente.',
        'Projeto guiado concluído.',
        '/solucoes',
      ),
      acao(
        'Leve uma dúvida para a mentoria',
        'Anote o que ficou incerto durante o projeto e leve um caso concreto para a próxima sessão.',
        'Dúvida preparada para a mentoria.',
        '/mentorias',
      ),
    ]);
    return {
      etapa,
      diagnostico:
        'Ainda não há clientes em Vendas. Comece pela formação e por um projeto guiado antes de prospectar.',
      foco: sinais.jornada.proximoPasso.titulo,
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
          'Registre na venda o que será feito, quem fará e em qual data.',
          'Próxima ação e data visíveis na oportunidade.',
          '/vendas',
        )
      : semCall
        ? acao(
            `Agende a descoberta${empresa ? ` com ${empresa}` : ''}`,
            'Use a reunião para entender o processo atual, o volume, o impacto do problema e quem decide.',
            'Reunião de descoberta vinculada ao cliente.',
            '/reunioes',
          )
        : acao(
            `Prepare a próxima conversa${empresa ? ` de ${empresa}` : ''}`,
            'Revise os dados do lead e prepare perguntas sobre o que ainda pode mudar escopo, prazo ou viabilidade.',
            'Perguntas específicas salvas para a reunião.',
            '/vendas',
          );
    const acoes = alinharAcoesComJornada(sinais, [
      principal,
      acao(
        'Pesquise o lead',
        'Busque somente os dados que ajudam na abordagem, na conversa ou na entrega.',
        'Informações e fontes salvas no lead.',
        '/vendas',
      ),
      acao(
        'Faça a reunião de descoberta',
        'Use a sala de reuniões para registrar a conversa e salvar os compromissos na ficha.',
        'Reunião concluída e próxima ação registrada.',
        '/reunioes',
      ),
    ]);
    return {
      etapa,
      diagnostico: `${quantidade(sinais.oportunidades.abertas, 'venda aberta', 'vendas abertas')}. Agora, prepare a conversa e registre a próxima ação na ficha.`,
      foco: empresa ? `Avançar a oportunidade de ${empresa}` : 'Preparar a primeira conversa',
      proximoPasso: acoes[0]!,
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
            'Use o que foi confirmado na reunião para definir escopo, entregáveis, prazo e investimento.',
            'Proposta comercial criada e vinculada à oportunidade.',
            '/propostas/nova',
          )
        : sinais.propostas.prontas > 0
          ? acao(
              'Apresente a proposta em uma conversa',
              'Apresente em uma reunião, confirme os critérios do cliente e registre as objeções antes de ajustar o documento.',
              'Proposta marcada como apresentada e follow-up agendado.',
              '/propostas',
            )
          : acao(
              'Conclua a proposta em aberto',
              'Revise o escopo, o que fica de fora e como o cliente avaliará o resultado antes de marcar como pronta.',
              'Proposta com todos os blocos revisados e status pronta.',
              '/propostas',
            );
    const acoes = alinharAcoesComJornada(sinais, [
      principal,
      acao(
        'Confira o escopo com a reunião',
        'Veja se cada entregável responde a um problema citado pelo cliente e marque o que ainda precisa ser confirmado.',
        'Escopo revisado com os dados da reunião.',
        '/vendas',
      ),
      acao(
        'Agende o próximo contato',
        'Defina o que o cliente precisa decidir, quem deve participar e a data da conversa.',
        'Reunião ou próximo contato registrado na ficha.',
        '/reunioes',
      ),
    ]);
    return {
      etapa,
      diagnostico: `${quantidade(sinais.propostas.total, 'proposta em andamento', 'propostas em andamento')}. Revise o que falta e conduza a decisão com o cliente.`,
      foco: empresa ? `Conduzir a decisão de ${empresa}` : 'Conduzir a proposta até uma decisão',
      proximoPasso: acoes[0]!,
      acoes,
      sinais,
      modelo: 'regra-factual-v1',
      geradoEm: agora,
    };
  }

  if (etapa === 'entregar') {
    const acoes = alinharAcoesComJornada(sinais, [
      acao(
        'Abra o projeto do cliente',
        'Escolha o projeto vendido e comece pela primeira fase com responsáveis, acessos e critérios de aceite.',
        'Projeto aberto com a primeira tarefa definida.',
        '/solucoes',
      ),
      acao(
        'Confirme o escopo com o cliente',
        'Registre o que será entregue, o que fica de fora e como o cliente aprovará o resultado.',
        'Escopo e critérios de aceite confirmados.',
        '/propostas',
      ),
      acao(
        'Agende as revisões do projeto',
        'Marque encontros curtos para mostrar o que foi feito e corrigir antes da entrega final.',
        'Próxima revisão agendada.',
        '/reunioes',
      ),
    ]);
    return {
      etapa,
      diagnostico:
        'Há uma venda confirmada. Use o escopo aprovado para acompanhar as tarefas e validar cada parte com o cliente.',
      foco: empresa ? `Entregar valor para ${empresa}` : 'Executar o primeiro projeto',
      proximoPasso: acoes[0]!,
      acoes,
      sinais,
      modelo: 'regra-factual-v1',
      geradoEm: agora,
    };
  }

  const acoes = alinharAcoesComJornada(sinais, [
    acao(
      'Registre o que funcionou',
      'Compare os projetos concluídos e anote as decisões, arquivos e testes que podem ser reutilizados.',
      'Passo a passo revisado e salvo.',
      '/builder',
    ),
    acao(
      'Documente um caso de cliente',
      'Registre o antes, o depois, as condições do projeto e um depoimento autorizado.',
      'Caso documentado com autorização de uso.',
      '/vendas',
    ),
    acao(
      'Escolha o próximo problema',
      'Leve os dados para a mentoria e escolha se o próximo ciclo deve melhorar venda, entrega ou capacidade.',
      'Um problema definido para o próximo ciclo.',
      '/mentorias',
    ),
  ]);
  return {
    etapa,
    diagnostico:
      'Mais de um projeto foi concluído. Registre o que se repetiu para vender e implementar com menos improviso.',
    foco: 'Repetir o que funcionou',
    proximoPasso: acoes[0]!,
    acoes,
    sinais,
    modelo: 'regra-factual-v1',
    geradoEm: agora,
  };
}
