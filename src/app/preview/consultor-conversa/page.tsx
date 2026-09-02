import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Bot, BriefcaseBusiness, ContactRound, FileText, House, Video } from 'lucide-react';
import { TelaSobral } from '@/app/(app)/consultor/_components/TelaSobral';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import { DirecaoMensagemSchema } from '@/lib/consultor/direcao';
import type { MensagemDoConsultor, ThreadDoConsultor } from '@/lib/consultor/queries';
import shell from '../mapa-jornada/preview.module.css';

export const metadata: Metadata = { title: 'Preview · Ação do Sobral AI' };

const MENSAGEM = '55555555-5555-4555-8555-555555555555';
const OPORTUNIDADE = '11111111-1111-4111-8111-111111111111';

const thread: ThreadDoConsultor = {
  id: '44444444-4444-4444-8444-444444444444',
  titulo: 'Próximo avanço da Clínica Aurora',
  criadoEm: '2026-08-10T18:00:00.000Z',
  atualizadoEm: '2026-08-10T18:10:00.000Z',
};

const mensagens: MensagemDoConsultor[] = [
  {
    id: '77777777-7777-4777-8777-777777777777',
    papel: 'usuario',
    anexos: [
      {
        id: '88888888-8888-4888-8888-888888888888',
        nome: 'gravacao.webm',
        tipoMime: 'audio/webm',
        tamanhoBytes: 248000,
        categoria: 'audio',
      },
    ],
    conteudo: 'Áudio enviado.',
    cartoes: [],
    direcao: null,
    acaoConfirmada: null,
    modelo: null,
    criadoEm: '2026-08-10T17:58:00.000Z',
  },
  {
    id: '66666666-6666-4666-8666-666666666666',
    papel: 'usuario',
    anexos: [],
    conteudo: 'O que eu preciso fazer agora para avançar a Clínica Aurora?',
    cartoes: [],
    direcao: null,
    acaoConfirmada: null,
    modelo: null,
    criadoEm: '2026-08-10T18:00:00.000Z',
  },
  {
    id: MENSAGEM,
    papel: 'consultor',
    anexos: [],
    conteudo:
      'A proposta já existe e o lead está em negociação. O avanço agora é conduzir uma decisão com data, não criar outro documento. Revise o escopo final e combine quando o cliente decide.',
    cartoes: [],
    direcao: DirecaoMensagemSchema.parse({
      etapa: 'vender',
      diagnostico:
        'A proposta está em curso e a próxima ação atual venceu. O risco é deixar a decisão depender de memória.',
      foco: 'Conduzir a decisão da Clínica Aurora',
      proximo_passo: {
        titulo: 'Confirmar decisor e data da decisão',
        detalhe:
          'Revise o escopo final com quem decide e registre uma data clara para a resposta do cliente.',
        evidencia: 'Decisor e data da resposta registrados na ficha do cliente.',
        destino: '/vendas',
      },
      acoes: [
        {
          titulo: 'Confirmar decisor e data da decisão',
          detalhe:
            'Revise o escopo final com quem decide e registre uma data clara para a resposta do cliente.',
          evidencia: 'Decisor e data da resposta registrados na ficha do cliente.',
          destino: '/vendas',
        },
      ],
      gerado_em: '2026-08-10T18:00:00.000Z',
      contexto_acao: {
        oportunidade_id: OPORTUNIDADE,
        empresa: 'Clínica Aurora',
        acao_sugerida: 'Confirmar decisor e data da decisão',
        acao_atual: 'Enviar proposta revisada para o contato',
        prazo_atual: '2026-08-09T12:00:00-03:00',
      },
    }),
    acaoConfirmada: {
      acao: 'Confirmar decisor e data da decisão',
      quando: '2026-08-12T12:00:00-03:00',
      confirmada_em: '2026-08-10T18:02:00.000Z',
      atualizado_em: '2026-08-10T18:10:00.000Z',
      status: 'concluida',
      concluida_em: '2026-08-10T18:10:00.000Z',
      recomendacao: {
        acao: 'Agendar uma conversa de decisão sobre a proposta',
        motivo:
          'A proposta já foi apresentada e você confirmou quem decide. Agora, marque a conversa e deixe claro qual decisão precisa sair dela.',
        fatos: [
          'Proposta · “Projeto de atendimento com IA” está com status apresentada.',
          'Reunião · Decisão: a diretora de operações fará a validação final.',
          'Vendas · O cliente está em negociação e ficou sem próxima ação após a conclusão.',
        ],
        quando: '2026-08-13T12:00:00-03:00',
        status: 'pendente',
        modelo: 'gpt-5.6-terra',
        gerada_em: '2026-08-10T18:10:04.000Z',
        confirmada_em: null,
      },
      historico: [
        {
          tipo: 'confirmada',
          acao_anterior: null,
          acao_nova: 'Confirmar decisor e data da decisão',
          quando_anterior: null,
          quando_novo: '2026-08-12T12:00:00-03:00',
          criado_em: '2026-08-10T18:02:00.000Z',
        },
        {
          tipo: 'concluida',
          acao_anterior: 'Confirmar decisor e data da decisão',
          acao_nova: 'Confirmar decisor e data da decisão',
          quando_anterior: '2026-08-12T12:00:00-03:00',
          quando_novo: '2026-08-12T12:00:00-03:00',
          criado_em: '2026-08-10T18:10:00.000Z',
        },
      ],
    },
    modelo: 'gpt-5.4-mini',
    criadoEm: '2026-08-10T18:00:10.000Z',
  },
];

export default function PreviewConsultorConversaPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <div className={shell.shell}>
      <aside className={shell.sidebar}>
        <div className={shell.logo}>
          <SubidoLogo size={18} />
        </div>
        <nav aria-label="Preview da navegação">
          <span>
            <House size={18} strokeWidth={1.7} aria-hidden="true" /> Início
          </span>
          <span>
            <ContactRound size={18} strokeWidth={1.7} aria-hidden="true" /> Vendas
          </span>
          <span>
            <Video size={18} strokeWidth={1.7} aria-hidden="true" /> Reuniões
          </span>
          <span>
            <FileText size={18} strokeWidth={1.7} aria-hidden="true" /> Propostas
          </span>
          <span>
            <BriefcaseBusiness size={18} strokeWidth={1.7} aria-hidden="true" /> Projetos
          </span>
          <a className={shell.ativo} href="#conteudo">
            <Bot size={18} strokeWidth={1.7} aria-hidden="true" /> Sobral AI
          </a>
        </nav>
      </aside>

      <main id="conteudo" className={shell.conteudo}>
        <TelaSobral threads={[thread]} conversa={{ thread, mensagens }} modoPreview />
      </main>
    </div>
  );
}
