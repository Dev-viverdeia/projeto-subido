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

export default function PreviewCallPreparoPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return (
    <main className={styles.preview}>
      <PreparacaoCall posCall={POS_CALL} />
    </main>
  );
}
