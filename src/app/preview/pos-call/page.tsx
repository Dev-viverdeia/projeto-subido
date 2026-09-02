import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DossiePosCall } from '@/app/(app)/calls/[id]/_components/DossiePosCall';
import type { PosCall } from '@/lib/calls/queries';
import styles from './preview.module.css';

export const metadata: Metadata = { title: 'Preview · Resumo da reunião' };

const POS_CALL: PosCall = {
  reuniao: {
    id: '11111111-1111-4111-8111-111111111111',
    titulo: 'Descoberta do atendimento da Clínica Horizonte',
    tipo: 'descoberta',
    status: 'concluida',
    agendadaPara: '2026-08-08T17:00:00.000Z',
    iniciadaEm: '2026-08-08T17:02:00.000Z',
    encerradaEm: '2026-08-08T17:44:00.000Z',
    duracaoMinutos: 45,
    liveCoachAtivo: true,
    codigoPublico: 'preview-clinica-horizonte',
  },
  empresa: { nome: 'Clínica Horizonte', setor: 'Saúde', porte: 'Médio' },
  contato: { nome: 'Marina Alves', cargo: 'Diretora de Operações' },
  oportunidade: {
    id: '22222222-2222-4222-8222-222222222222',
    titulo: 'Automação do atendimento',
    etapa: 'descoberta',
    proximaAcao: null,
    proximaAcaoEm: null,
  },
  analise: {
    status: 'concluida',
    resumo:
      'A clínica confirmou que a troca de turno fragmenta o atendimento e aumenta o tempo de primeira resposta. Existe abertura para um piloto em uma unidade, desde que a solução preserve a revisão humana e apresente indicadores simples de acompanhamento.',
    dores: [
      'Mensagens recebidas na troca de turno ficam sem responsável claramente identificado.',
      'A direção não consegue medir tempo de primeira resposta nem volume por tipo de solicitação.',
      'A recepção repete perguntas porque o histórico fica espalhado entre conversas individuais.',
    ],
    objecoes: [
      'A clínica não aceita respostas clínicas automatizadas sem revisão de uma pessoa responsável.',
      'O time teme que uma nova ferramenta aumente o trabalho operacional no início.',
    ],
    decisoes: [
      'O piloto ficará restrito ao WhatsApp de uma única unidade.',
      'A IA fará triagem e organização; respostas clínicas continuarão sob revisão humana.',
    ],
    compromissos: [
      'Marina enviará uma amostra anonimizada das conversas até sexta-feira.',
      'O prestador devolverá um diagnóstico com fluxo, riscos e indicadores do piloto.',
    ],
    proximosPassos: [
      'Enviar o diagnóstico do piloto para Marina e marcar uma apresentação de 30 minutos.',
      'Validar com TI como o histórico do WhatsApp pode ser disponibilizado com segurança.',
    ],
    oportunidadesProjeto: [
      'Hipótese: implementar triagem assistida para classificar mensagens, sugerir prioridade e encaminhar cada solicitação.',
      'Hipótese: criar um painel factual de atendimento com tempo de resposta, categoria e pendências por turno.',
    ],
    lacunas: [
      'Quem aprova o orçamento e quais pessoas participam da decisão final?',
      'Qual é o volume real de mensagens por unidade e por faixa de horário?',
      'A ferramenta atual permite integração oficial ou será necessário outro caminho técnico?',
    ],
    sinaisCompra: [
      'A diretora pediu que o diagnóstico venha acompanhado de cronograma e faixa de investimento.',
      'O contato aceitou separar uma amostra de conversas para viabilizar o desenho do piloto.',
    ],
    briefingOperacional: null,
    sentimento: 'cauteloso',
    notaComercial: 76,
    erro: null,
    atualizadaEm: '2026-08-08T17:46:00.000Z',
  },
  transcricao: {
    status: 'concluida',
    textoCompleto: null,
    duracaoSegundos: 2_520,
    atualizadaEm: '2026-08-08T17:45:00.000Z',
    segmentos: [
      {
        itemId: 'preview-1',
        texto:
          'Hoje a gente recebe tudo no mesmo WhatsApp. Quando muda o turno, parte das mensagens fica esperando porque ninguém sabe exatamente o que já foi respondido.',
        ordinal: 1,
        segundoReuniao: 342,
        finalizadoEm: '2026-08-08T17:08:00.000Z',
        falanteNome: 'Marina Alves',
        falantePapel: 'convidado',
      },
      {
        itemId: 'preview-2',
        texto:
          'Eu toparia testar em uma unidade primeiro, mas qualquer orientação clínica precisa continuar passando pela nossa equipe.',
        ordinal: 2,
        segundoReuniao: 1_126,
        finalizadoEm: '2026-08-08T17:21:00.000Z',
        falanteNome: 'Rafael',
        falantePapel: 'anfitriao',
      },
      {
        itemId: 'preview-3',
        texto:
          'Se você conseguir montar esse diagnóstico com um cronograma e uma noção de investimento, eu levo para o diretor financeiro.',
        ordinal: 3,
        segundoReuniao: 2_208,
        finalizadoEm: '2026-08-08T17:39:00.000Z',
        falanteNome: 'Marina Alves',
        falantePapel: 'convidado',
      },
    ],
  },
  gravacao: {
    status: 'concluida',
    urlTemporaria: '/preview-call.mp3',
    duracaoSegundos: 2_176,
    tamanhoBytes: 18_420_000,
    mimeType: 'audio/mpeg',
    atualizadaEm: '2026-08-15T14:49:00.000Z',
  },
  coach: [
    {
      id: 'coach-1',
      categoria: 'impacto',
      titulo: 'Dimensione o custo da espera',
      sugestao:
        'Pergunte quantos atendimentos por semana precisam ser retomados por falta de contexto.',
      metodologia: 'SPIN · implicação',
      trechoGatilho: 'Parte das mensagens fica esperando.',
      prioridade: 3,
      status: 'vista',
      segundoReuniao: 365,
    },
    {
      id: 'coach-2',
      categoria: 'decisao',
      titulo: 'Mapeie quem precisa aprovar',
      sugestao: 'Pergunte quem, além dela, precisa concordar com escopo, segurança e investimento.',
      metodologia: 'MEDDIC · processo de decisão',
      trechoGatilho: 'Eu levo para o diretor financeiro.',
      prioridade: 2,
      status: 'nova',
      segundoReuniao: 2_220,
    },
  ],
  preparacao: {
    temEnriquecimento: true,
    plano: {
      origem: 'enriquecimento',
      objetivo: 'Confirmar a prioridade da automação do atendimento.',
      abertura: 'Quero entender o processo atual antes de sugerir a solução.',
      perguntas: [],
      fechamento: {
        sinalParaAvancar: 'Dor, impacto e decisor confirmados.',
        frase: 'Faz sentido desenhar um piloto?',
        proximoPasso: 'Enviar o diagnóstico do piloto.',
      },
      fatos: [],
      hipoteses: [],
      projetos: [],
    },
  },
  sincronizacao: {
    historicoCrm: true,
    acoesPlano: [],
    projetoAtivo: { id: 'projeto-preview', titulo: 'Piloto de atendimento assistido' },
    propostaDaCall: null,
  },
};

export default async function PreviewPosCallPage({ searchParams }: PageProps<'/preview/pos-call'>) {
  if (process.env.NODE_ENV === 'production') notFound();
  const parametros = await searchParams;
  const processando = parametros.estado === 'processando';
  const kickoff = parametros.tipo === 'kickoff';
  const base: PosCall = kickoff
    ? {
        ...POS_CALL,
        reuniao: {
          ...POS_CALL.reuniao,
          tipo: 'kickoff',
          titulo: 'Kickoff do projeto de atendimento',
        },
        oportunidade: { ...POS_CALL.oportunidade, etapa: 'ganho' },
        analise: POS_CALL.analise
          ? {
              ...POS_CALL.analise,
              resumo:
                'O projeto começa pela unidade principal, com a direção de operações como responsável e uma primeira validação em duas semanas.',
              briefingOperacional: {
                objetivo: 'Reduzir o tempo de primeira resposta no WhatsApp da unidade principal.',
                criterio_sucesso: 'Responder 80% das mensagens em até cinco minutos.',
                responsavel_cliente: 'Marina Alves',
                responsavel_tecnico: 'Rafael Milagre',
                acessos: ['WhatsApp da unidade', 'Amostra anonimizada de conversas'],
                limites: ['Nenhuma orientação clínica sem revisão humana'],
                proximos_passos: ['Marina libera a amostra até sexta-feira'],
              },
            }
          : null,
      }
    : POS_CALL;
  const posCall = processando
    ? {
        ...base,
        reuniao: { ...base.reuniao, status: 'processando' as const, encerradaEm: null },
        analise: null,
        transcricao: base.transcricao ? { ...base.transcricao, status: 'processando' } : null,
      }
    : base;

  return (
    <main className={styles.preview}>
      <DossiePosCall posCall={posCall} estadoAcao={null} />
    </main>
  );
}
