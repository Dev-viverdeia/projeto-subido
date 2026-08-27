import type { DossieEnriquecido, RoteiroCall } from '@/lib/crm/enriquecimento';
import { obterRoteiroCall } from '@/lib/crm/enriquecimento';
import type { TipoCall } from './tipos';

export type PerguntaPlanoCall = RoteiroCall['perguntas'][number];

export type PlanoCall = {
  origem: 'enriquecimento' | 'base';
  objetivo: string;
  abertura: string;
  perguntas: PerguntaPlanoCall[];
  fechamento: RoteiroCall['fechamento'];
  fatos: string[];
  hipoteses: string[];
  projetos: string[];
};

type EntradaPlanoCall = {
  tipo: TipoCall;
  empresa: string;
  oportunidade: string;
  proximaAcao: string | null;
  dossie: DossieEnriquecido | null;
};

const pergunta = (
  etapa: PerguntaPlanoCall['etapa'],
  texto: string,
  intencao: string,
  projetoRelacionado: string | null = null,
): PerguntaPlanoCall => ({ etapa, pergunta: texto, intencao, projetoRelacionado });

function planoBase({
  tipo,
  empresa,
  oportunidade,
  proximaAcao,
}: Omit<EntradaPlanoCall, 'dossie'>): Omit<
  PlanoCall,
  'origem' | 'fatos' | 'hipoteses' | 'projetos'
> {
  const proximoPasso = proximaAcao ?? 'Combinar o próximo passo, o responsável e uma data.';

  if (tipo === 'follow_up') {
    return {
      objetivo: `Retomar ${oportunidade} e sair com uma decisão clara sobre o próximo avanço.`,
      abertura: `Quero retomar o que ficou combinado e entender o que precisa acontecer para avançarmos com segurança.`,
      perguntas: [
        pergunta(
          'contexto',
          'O que mudou desde a nossa última conversa?',
          'Atualizar o contexto antes de retomar a decisão.',
        ),
        pergunta(
          'processo',
          'Qual ponto ainda precisa ser resolvido para este projeto avançar?',
          'Localizar a pendência que trava a venda.',
        ),
        pergunta(
          'impacto',
          'O que acontece se esse problema continuar sem solução neste momento?',
          'Revalidar urgência e impacto.',
        ),
        pergunta(
          'decisao',
          'Quem precisa participar do próximo passo e qual decisão esperamos dessa pessoa?',
          'Definir decisores e compromisso concreto.',
        ),
      ],
      fechamento: {
        sinalParaAvancar: 'A pendência está clara e há responsável e data para resolvê-la.',
        frase:
          'Podemos registrar esse próximo passo com responsável e data para não perder o avanço?',
        proximoPasso,
      },
    };
  }

  if (tipo === 'proposta') {
    return {
      objetivo: `Validar a aderência da proposta de ${oportunidade} e conduzir uma decisão.`,
      abertura: `Vou conectar cada parte da proposta ao problema que queremos resolver e, no fim, alinhamos a decisão e o próximo passo.`,
      perguntas: [
        pergunta(
          'contexto',
          'O resultado esperado continua sendo o mesmo que alinhamos?',
          'Confirmar a referência de sucesso antes de apresentar.',
        ),
        pergunta(
          'processo',
          'Qual parte do escopo precisa ficar mais clara para vocês?',
          'Encontrar dúvidas reais sem reapresentar tudo.',
        ),
        pergunta(
          'impacto',
          'O investimento faz sentido diante do impacto que esse problema gera hoje?',
          'Conectar valor, impacto e investimento.',
        ),
        pergunta(
          'decisao',
          'Além de você, quem participa da aprovação e o que essa pessoa precisa validar?',
          'Mapear o caminho real da decisão.',
        ),
        pergunta(
          'decisao',
          'Se resolvermos os pontos em aberto, qual é a melhor data para começar?',
          'Transformar interesse em compromisso.',
        ),
      ],
      fechamento: {
        sinalParaAvancar: 'Escopo, investimento, decisor e data de início estão claros.',
        frase:
          'Com esses pontos resolvidos, podemos confirmar o início e registrar os responsáveis?',
        proximoPasso,
      },
    };
  }

  if (tipo === 'kickoff') {
    return {
      objetivo: `Começar ${oportunidade} com resultado, escopo, responsáveis e acessos claros.`,
      abertura: `Hoje vamos transformar o que foi vendido em um plano de execução claro para os dois lados.`,
      perguntas: [
        pergunta(
          'contexto',
          'Qual resultado precisa estar visível para considerarmos este projeto bem-sucedido?',
          'Definir o critério de sucesso da entrega.',
        ),
        pergunta(
          'processo',
          'Quem será o responsável pelo projeto dentro da empresa?',
          'Estabelecer uma referência operacional.',
        ),
        pergunta(
          'processo',
          'Quais acessos, dados e aprovações precisamos liberar primeiro?',
          'Remover bloqueios de início.',
        ),
        pergunta(
          'impacto',
          'Qual risco ou limite não pode ser ultrapassado durante a implementação?',
          'Proteger a operação e o escopo.',
        ),
        pergunta(
          'decisao',
          'Qual será a rotina de validação e quem dá a aprovação final?',
          'Definir governança e aceite.',
        ),
      ],
      fechamento: {
        sinalParaAvancar:
          'Critério de sucesso, responsáveis, acessos e primeira entrega têm dono e data.',
        frase: 'Podemos recapitular responsáveis e datas para sair daqui com o início destravado?',
        proximoPasso,
      },
    };
  }

  if (tipo === 'entrega') {
    return {
      objetivo: `Validar o resultado de ${oportunidade}, registrar pendências e formalizar a continuidade.`,
      abertura: `Quero comparar a entrega com o resultado combinado, validar o uso real e sair com qualquer ajuste bem definido.`,
      perguntas: [
        pergunta(
          'contexto',
          'O que já mudou na operação desde que a solução entrou em uso?',
          'Trazer o resultado percebido pelo cliente.',
        ),
        pergunta(
          'processo',
          'Em qual situação a solução ainda não funciona como esperado?',
          'Localizar pendências concretas.',
        ),
        pergunta(
          'impacto',
          'Qual ganho de tempo, capacidade ou qualidade já conseguimos observar?',
          'Registrar evidência de valor.',
        ),
        pergunta(
          'decisao',
          'O que precisa ser validado para aceitarmos esta etapa como concluída?',
          'Formalizar o aceite.',
        ),
        pergunta(
          'decisao',
          'Existe uma próxima melhoria que merece ser priorizada depois desta entrega?',
          'Abrir continuidade sem forçar uma venda.',
        ),
      ],
      fechamento: {
        sinalParaAvancar:
          'Resultado e pendências foram validados, com aceite ou plano de correção definido.',
        frase:
          'Podemos registrar o aceite desta etapa e os únicos pontos que ainda precisam de ajuste?',
        proximoPasso,
      },
    };
  }

  if (tipo === 'outro') {
    return {
      objetivo: `Entender o objetivo da conversa com ${empresa} e sair com uma decisão útil para ${oportunidade}.`,
      abertura:
        'Antes de avançarmos, quero alinhar o que precisa estar resolvido ao final desta conversa.',
      perguntas: [
        pergunta(
          'contexto',
          'Qual é a decisão mais importante que precisamos tomar hoje?',
          'Definir o foco da conversa.',
        ),
        pergunta(
          'processo',
          'O que já foi tentado e o que continua em aberto?',
          'Evitar repetir caminhos sem resultado.',
        ),
        pergunta(
          'impacto',
          'Qual é o impacto prático de não resolvermos isso agora?',
          'Entender urgência e prioridade.',
        ),
        pergunta(
          'decisao',
          'Quem assume o próximo passo e até quando?',
          'Fechar com compromisso verificável.',
        ),
      ],
      fechamento: {
        sinalParaAvancar: 'Há uma decisão clara, responsável e prazo.',
        frase: 'Vamos confirmar o que ficou decidido, quem faz e até quando?',
        proximoPasso,
      },
    };
  }

  return {
    objetivo: `Entender a operação da ${empresa}, confirmar a dor prioritária e avaliar se ${oportunidade} merece avançar.`,
    abertura:
      'Quero entender como o processo funciona hoje antes de sugerir qualquer projeto de IA.',
    perguntas: [
      pergunta(
        'contexto',
        'Qual resultado mais importante você quer melhorar neste processo?',
        'Entender o resultado que orienta a conversa.',
      ),
      pergunta(
        'processo',
        'Como esse processo acontece hoje, do início ao fim?',
        'Localizar o gargalo real.',
      ),
      pergunta(
        'impacto',
        'Quanto esse gargalo custa hoje em tempo, capacidade ou oportunidades perdidas?',
        'Dimensionar impacto e prioridade.',
      ),
      pergunta(
        'decisao',
        'Quem participa da decisão e o que precisa estar claro para aprovar um piloto?',
        'Definir o caminho real para avançar.',
      ),
    ],
    fechamento: {
      sinalParaAvancar:
        'Há uma dor confirmada, impacto relevante e alguém responsável pela decisão.',
      frase:
        'Faz sentido organizarmos um escopo inicial para validar esse projeto com quem participa da decisão?',
      proximoPasso,
    },
  };
}

export function montarPlanoCall(entrada: EntradaPlanoCall): PlanoCall {
  const base = planoBase(entrada);
  const dossie = entrada.dossie;
  if (!dossie) {
    return { ...base, origem: 'base', fatos: [], hipoteses: [], projetos: [] };
  }

  const roteiro = obterRoteiroCall(dossie);
  const usarRoteiroDescoberta = entrada.tipo === 'descoberta';
  const perguntasPersonalizadas = usarRoteiroDescoberta
    ? roteiro.perguntas
    : [
        ...base.perguntas.slice(0, 2),
        ...roteiro.perguntas.filter((item) => item.etapa === 'impacto' || item.etapa === 'decisao'),
        ...base.perguntas.slice(2),
      ]
        .filter(
          (item, indice, itens) =>
            itens.findIndex(
              (candidata) =>
                candidata.pergunta.trim().toLocaleLowerCase('pt-BR') ===
                item.pergunta.trim().toLocaleLowerCase('pt-BR'),
            ) === indice,
        )
        .slice(0, 6);

  return {
    ...base,
    origem: 'enriquecimento',
    objetivo: usarRoteiroDescoberta ? roteiro.objetivo : base.objetivo,
    abertura: usarRoteiroDescoberta ? roteiro.abertura : base.abertura,
    perguntas: perguntasPersonalizadas,
    fechamento: usarRoteiroDescoberta
      ? roteiro.fechamento
      : {
          ...base.fechamento,
          proximoPasso: dossie.proximaAcao.acao || base.fechamento.proximoPasso,
        },
    fatos: dossie.fatos.slice(0, 4).map((item) => `${item.titulo}: ${item.valor}`),
    hipoteses: dossie.hipoteses.slice(0, 3).map((item) => item.titulo),
    projetos: dossie.oportunidades.slice(0, 3).map((item) => item.titulo),
  };
}
