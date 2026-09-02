import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PreparacaoCall } from '@/app/(app)/calls/[id]/_components/PreparacaoCall';
import type { PosCall } from '@/lib/calls/queries';
import styles from '../pos-call/preview.module.css';

export const metadata: Metadata = { title: 'Preview · Preparação da reunião' };

const POS_CALL: PosCall = {
  reuniao: {
    id: '11111111-1111-4111-8111-111111111111',
    titulo: 'Descoberta do atendimento da Clínica Horizonte',
    tipo: 'descoberta',
    status: 'agendada',
    agendadaPara: '2026-09-10T17:00:00.000Z',
    iniciadaEm: null,
    encerradaEm: null,
    duracaoMinutos: 45,
    liveCoachAtivo: true,
    codigoPublico: 'preview-clinica-horizonte',
  },
  empresa: { nome: 'Clínica Horizonte', setor: 'Saúde', porte: 'Médio' },
  contato: { nome: 'Marina Alves', cargo: 'Diretora de Operações' },
  oportunidade: {
    id: '22222222-2222-4222-8222-222222222222',
    titulo: 'SDR de atendimento',
    etapa: 'descoberta',
    proximaAcao: 'Desenhar um piloto para uma unidade.',
    proximaAcaoEm: '2026-09-12T15:00:00.000Z',
  },
  analise: null,
  transcricao: null,
  gravacao: null,
  coach: [],
  preparacao: {
    temEnriquecimento: true,
    plano: {
      origem: 'enriquecimento',
      objetivo:
        'Confirmar se a perda de contatos na troca de turno justifica um piloto de SDR de atendimento com IA.',
      abertura:
        'Quero entender como o atendimento funciona hoje e avaliar se um piloto pequeno faz sentido para a operação.',
      perguntas: [
        {
          etapa: 'contexto',
          pergunta: 'Qual resultado mais importante você quer melhorar no atendimento?',
          intencao: 'Entender o resultado que orienta a conversa.',
          projetoRelacionado: null,
        },
        {
          etapa: 'processo',
          pergunta: 'Como as mensagens são distribuídas quando há troca de turno?',
          intencao: 'Localizar onde os contatos ficam sem responsável.',
          projetoRelacionado: 'SDR de atendimento com IA',
        },
        {
          etapa: 'impacto',
          pergunta: 'Quantas oportunidades ficam sem resposta em uma semana comum?',
          intencao: 'Dimensionar se a dor justifica prioridade e investimento.',
          projetoRelacionado: 'SDR de atendimento com IA',
        },
        {
          etapa: 'decisao',
          pergunta: 'Quem precisa participar da decisão para aprovar um piloto?',
          intencao: 'Definir o caminho real para a oportunidade avançar.',
          projetoRelacionado: 'SDR de atendimento com IA',
        },
      ],
      fechamento: {
        sinalParaAvancar:
          'Há uma dor confirmada, impacto relevante e alguém responsável por aprovar o piloto.',
        frase: 'Faz sentido organizarmos o escopo de um piloto para uma unidade?',
        proximoPasso: 'Desenhar um piloto para uma unidade.',
      },
      fatos: [
        'Canal principal: WhatsApp',
        'Atendimento: duas equipes em turnos',
        'Decisora provável: Diretora de Operações',
      ],
      hipoteses: ['Contatos sem responsável durante a troca de turno'],
      projetos: ['SDR de atendimento com IA'],
    },
  },
  sincronizacao: {
    historicoCrm: false,
    acoesPlano: [],
    projetoAtivo: null,
    propostaDaCall: null,
  },
};

const POS_CALL_KICKOFF: PosCall = {
  ...POS_CALL,
  reuniao: {
    ...POS_CALL.reuniao,
    titulo: 'Kickoff do projeto de atendimento',
    tipo: 'kickoff',
    codigoPublico: 'preview-kickoff-clinica-horizonte',
  },
  oportunidade: {
    ...POS_CALL.oportunidade,
    etapa: 'ganho',
    proximaAcao: 'Confirmar o acordo e iniciar a primeira tarefa.',
  },
  preparacao: {
    temEnriquecimento: true,
    plano: {
      origem: 'enriquecimento',
      objetivo:
        'Confirmar resultado, responsáveis, acessos e limites para começar o SDR de atendimento com IA.',
      abertura:
        'Hoje vamos transformar o que foi aprovado em um plano de trabalho claro para os dois lados.',
      perguntas: [
        {
          etapa: 'contexto',
          pergunta:
            'Qual resultado precisa estar visível para considerarmos o projeto bem-sucedido?',
          intencao: 'Definir o critério de sucesso da entrega.',
          projetoRelacionado: 'SDR de atendimento com IA',
        },
        {
          etapa: 'processo',
          pergunta: 'Quem responde pelo projeto e pelas aprovações dentro da clínica?',
          intencao: 'Definir responsáveis dos dois lados.',
          projetoRelacionado: 'SDR de atendimento com IA',
        },
        {
          etapa: 'processo',
          pergunta: 'Quais acessos e dados precisam ser liberados primeiro?',
          intencao: 'Remover bloqueios antes da primeira tarefa.',
          projetoRelacionado: 'SDR de atendimento com IA',
        },
        {
          etapa: 'decisao',
          pergunta: 'Qual limite não pode ser ultrapassado durante a implementação?',
          intencao: 'Proteger a operação e o escopo aprovado.',
          projetoRelacionado: 'SDR de atendimento com IA',
        },
      ],
      fechamento: {
        sinalParaAvancar: 'Resultado, responsáveis, acessos e primeira entrega têm dono e data.',
        frase: 'Podemos recapitular o acordo para iniciar a primeira tarefa?',
        proximoPasso: 'Confirmar o acordo e iniciar a primeira tarefa.',
      },
      fatos: [
        'Escopo aprovado: SDR de atendimento com IA',
        'Canal principal: WhatsApp',
        'Responsável comercial: Marina Alves',
      ],
      hipoteses: ['Acesso à conta de WhatsApp ainda precisa ser liberado'],
      projetos: [],
    },
  },
  sincronizacao: {
    ...POS_CALL.sincronizacao,
    projetoAtivo: {
      id: '33333333-3333-4333-8333-333333333333',
      titulo: 'SDR de atendimento para Clínica Horizonte',
    },
  },
};

export default async function PreviewCallPreparoPage({
  searchParams,
}: PageProps<'/preview/call-preparo'>) {
  if (process.env.NODE_ENV === 'production') notFound();
  const parametros = await searchParams;
  return (
    <main className={styles.preview}>
      <PreparacaoCall posCall={parametros.tipo === 'kickoff' ? POS_CALL_KICKOFF : POS_CALL} />
    </main>
  );
}
