import { z } from 'zod';
import { EtapaSobralSchema, type EtapaSobral } from './etapas';
import { alinharAcoesComJornada } from './jornada-plano';
import { EventoAcaoCrmSchema, RecomendacaoProximaAcaoSchema } from './recomendacao';
import type { SinaisSobral } from './sinais';

export { ETAPAS_SOBRAL, EtapaSobralSchema, indiceDaEtapa, type EtapaSobral } from './etapas';
export { SinaisSobralSchema, type SinaisSobral } from './sinais';

export const DestinoSobralSchema = z.enum([
  '/inicio',
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
        'Escolha seu primeiro projeto',
        'Abra os projetos padrão e escolha um serviço que você consiga explicar para uma empresa.',
        'Projeto salvo como sua primeira oferta.',
        '/solucoes',
      ),
      acao(
        'Conclua a formação do projeto',
        'Faça a formação ligada ao projeto escolhido e anote as dúvidas que surgirem.',
        'Formação concluída e dúvidas anotadas.',
        '/formacoes',
      ),
      acao(
        'Escreva como você apresenta o serviço',
        'Explique em uma frase o problema, para quem ele aparece e qual resultado o projeto entrega.',
        'Apresentação do serviço salva sem jargão técnico.',
        '/formacoes',
      ),
    ]);
    return {
      etapa,
      diagnostico:
        'Ainda não há oportunidades no CRM. Primeiro, escolha o projeto que você quer aprender e vender.',
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
          'Registre no CRM o que será feito, quem fará e em qual data.',
          'Próxima ação e data visíveis na oportunidade.',
          '/crm',
        )
      : semCall
        ? acao(
            `Agende a descoberta${empresa ? ` com ${empresa}` : ''}`,
            'Use a call para entender o processo atual, o volume, o impacto do problema e quem decide.',
            'Call de descoberta vinculada à oportunidade.',
            '/calls',
          )
        : acao(
            `Prepare a próxima conversa${empresa ? ` de ${empresa}` : ''}`,
            'Revise os dados do lead e prepare perguntas sobre o que ainda pode mudar escopo, prazo ou viabilidade.',
            'Perguntas específicas salvas para a call.',
            '/crm',
          );
    const acoes = alinharAcoesComJornada(sinais, [
      principal,
      acao(
        'Pesquise o lead',
        'Busque somente os dados que ajudam na abordagem, na conversa ou na entrega.',
        'Informações e fontes salvas no lead.',
        '/crm',
      ),
      acao(
        'Faça a call de descoberta',
        'Use a sala de calls para registrar a conversa e salvar os compromissos no CRM.',
        'Call concluída e próxima ação registrada.',
        '/calls',
      ),
    ]);
    return {
      etapa,
      diagnostico: `${quantidade(sinais.oportunidades.abertas, 'oportunidade aberta', 'oportunidades abertas')}. Agora, prepare a conversa e registre a próxima ação no CRM.`,
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
            'Use o que foi confirmado na call para definir escopo, entregáveis, prazo e investimento.',
            'Proposta comercial criada e vinculada à oportunidade.',
            '/propostas/nova',
          )
        : sinais.propostas.prontas > 0
          ? acao(
              'Apresente a proposta em uma conversa',
              'Apresente em uma call, confirme os critérios do cliente e registre as objeções antes de ajustar o documento.',
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
        'Confira o escopo com a call',
        'Veja se cada entregável responde a um problema citado pelo cliente e marque o que ainda precisa ser confirmado.',
        'Escopo revisado com os dados da call.',
        '/crm',
      ),
      acao(
        'Agende o próximo contato',
        'Defina o que o cliente precisa decidir, quem deve participar e a data da conversa.',
        'Reunião ou follow-up registrado no CRM.',
        '/calls',
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
        '/calls',
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
      '/crm',
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
