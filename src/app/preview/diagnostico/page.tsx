import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  Bot,
  BriefcaseBusiness,
  ContactRound,
  DraftingCompass,
  FileSignature,
  GraduationCap,
  House,
  ScanSearch,
  Video,
} from 'lucide-react';
import { ExecutorDiagnostico } from '@/app/(app)/diagnosticos/_components/ExecutorDiagnostico';
import { PainelRelatorio } from '@/app/(app)/diagnosticos/_components/PainelRelatorio';
import type { DiagnosticoCompleto } from '@/lib/diagnosticos/queries';
import { RelatorioDiagnosticoSchema } from '@/lib/diagnosticos/schema';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import shell from '../mapa-jornada/preview.module.css';
import styles from './preview.module.css';

export const metadata: Metadata = { title: 'Preview · Diagnóstico de atendimento' };

const EVIDENCIA_SITE = {
  trecho: 'Fale com nossa equipe pelo WhatsApp para saber mais.',
  origem: 'site' as const,
  fonte: 'Página de contato',
};

const RELATORIO = RelatorioDiagnosticoSchema.parse({
  resumo:
    'A Clínica Aurora deixa o canal de entrada visível, mas a amostra de conversa perde o motivo do contato e termina sem prazo de retorno. O principal ganho está em preservar contexto entre a primeira mensagem e o encaminhamento humano.',
  veredito:
    'O cliente consegue entrar. O atendimento ainda não garante que ele saiba o que acontece depois.',
  cobertura: 'substancial',
  aviso_escopo:
    'A leitura combina quatro páginas públicas e uma conversa autorizada. Não mede o atendimento por telefone nem generaliza a amostra para toda a equipe.',
  dimensoes: {
    acesso: {
      nota: 86,
      cobertura: 'observada',
      leitura: 'O WhatsApp aparece na navegação e pode ser iniciado em dois pontos da página.',
      evidencias: [EVIDENCIA_SITE],
      comoValidar: 'Repetir o acesso em celular e computador sem sessão anterior.',
    },
    clareza: {
      nota: 72,
      cobertura: 'observada',
      leitura:
        'O canal é claro, mas não antecipa horário, prazo de resposta ou informações necessárias.',
      evidencias: [EVIDENCIA_SITE],
      comoValidar: 'Confirmar quais orientações a recepção deseja mostrar antes do contato.',
    },
    contexto: {
      nota: 48,
      cobertura: 'observada',
      leitura: 'A conversa pergunta o nome, mas não registra convênio, especialidade nem urgência.',
      evidencias: [
        {
          trecho: 'Pode me informar seu nome? Vou passar para a recepção.',
          origem: 'conversa',
          fonte: 'Conversa autorizada',
        },
      ],
      comoValidar: 'Revisar uma amostra maior e mapear os campos realmente necessários.',
    },
    continuidade: {
      nota: 42,
      cobertura: 'observada',
      leitura: 'O encaminhamento não identifica responsável nem estabelece prazo de retorno.',
      evidencias: [
        {
          trecho: 'Vou encaminhar e eles entram em contato.',
          origem: 'conversa',
          fonte: 'Conversa autorizada',
        },
      ],
      comoValidar: 'Acompanhar o caso até o retorno e registrar quem assumiu a conversa.',
    },
    confianca: {
      nota: 64,
      cobertura: 'parcial',
      leitura:
        'O site identifica equipe e endereço, mas a conversa não confirma protocolo ou próximo passo.',
      evidencias: [
        {
          trecho: 'Conheça nossa equipe e nossas unidades.',
          origem: 'site',
          fonte: 'Página institucional',
        },
      ],
      comoValidar:
        'Perguntar a clientes recentes quais sinais reduziram insegurança no agendamento.',
    },
  },
  fatos: [
    {
      titulo: 'O WhatsApp está acessível na jornada pública',
      evidencia: EVIDENCIA_SITE,
      impacto:
        'O cliente não precisa procurar um telefone ou preencher um formulário antes de começar.',
    },
    {
      titulo: 'A conversa não confirma prazo de retorno',
      evidencia: {
        trecho: 'Vou encaminhar e eles entram em contato.',
        origem: 'conversa',
        fonte: 'Conversa autorizada',
      },
      impacto: 'O cliente termina sem saber quando agir novamente ou quem assumiu o caso.',
    },
  ],
  falhas: [
    {
      titulo: 'Encaminhamento sem dono e sem prazo',
      severidade: 'alta',
      impacto: 'A responsabilidade fica invisível para o cliente e para quem recebe a demanda.',
      evidencia: {
        trecho: 'Vou encaminhar e eles entram em contato.',
        origem: 'conversa',
        fonte: 'Conversa autorizada',
      },
    },
    {
      titulo: 'Triagem interrompida antes do motivo do contato',
      severidade: 'media',
      impacto: 'A recepção precisa recomeçar a descoberta e o cliente repete informações.',
      evidencia: {
        trecho: 'Pode me informar seu nome? Vou passar para a recepção.',
        origem: 'conversa',
        fonte: 'Conversa autorizada',
      },
    },
  ],
  hipoteses: [
    {
      titulo: 'A troca de turno pode quebrar o histórico',
      explicacao: 'A amostra não identifica responsável, mas não mostra uma troca de turno real.',
      comoValidar: 'Perguntar como conversas abertas são repassadas entre os horários da recepção.',
    },
    {
      titulo: 'Pedidos de convênio podem gerar retrabalho',
      explicacao: 'O cenário cita convênio, porém a conversa analisada não chegou a esse ponto.',
      comoValidar: 'Medir quantas mensagens são trocadas até confirmar cobertura e documentação.',
    },
  ],
  oportunidades: [
    {
      titulo: 'Triagem assistida antes da transferência',
      impacto: 'Entregar cada conversa à recepção com motivo, convênio e urgência registrados.',
      mecanismo:
        'Um fluxo curto coleta os campos mínimos, resume o caso e preserva o histórico para a pessoa responsável.',
      evidencia_base: 'A amostra registra somente o nome antes de encaminhar.',
      projeto_slug: 'sdr-atendimento-qualificacao',
      projeto_titulo: 'SDR de Atendimento e Qualificação',
    },
    {
      titulo: 'Acompanhamento de retorno prometido',
      impacto: 'Dar visibilidade às conversas que aguardam resposta humana.',
      mecanismo:
        'Cada encaminhamento recebe responsável, prazo e alerta enquanto permanecer aberto.',
      evidencia_base: 'O retorno foi prometido sem responsável ou prazo.',
      projeto_slug: 'inteligencia-comercial-com-ia',
      projeto_titulo: 'Inteligência Comercial com IA',
    },
  ],
  plano_correcao: [
    {
      ordem: 1,
      acao: 'Definir os campos mínimos da triagem.',
      resultado_esperado: 'A recepção recebe contexto suficiente sem alongar a primeira conversa.',
      evidencia_conclusao: 'Roteiro aprovado pela pessoa responsável pelo atendimento.',
    },
    {
      ordem: 2,
      acao: 'Atribuir responsável e prazo a cada transferência.',
      resultado_esperado: 'Toda promessa de retorno fica acompanhável até a conclusão.',
      evidencia_conclusao: 'Cinco testes seguidos exibem responsável e prazo no histórico.',
    },
    {
      ordem: 3,
      acao: 'Testar a jornada com três cenários reais.',
      resultado_esperado: 'O fluxo cobre agendamento, convênio e dúvida pós-consulta.',
      evidencia_conclusao: 'Relatório dos três testes sem perda de contexto.',
    },
  ],
  perguntas_descoberta: [
    'Quem assume uma conversa depois que ela é encaminhada pela primeira pessoa?',
    'Qual prazo de retorno vocês consideram aceitável em cada tipo de solicitação?',
    'Quais informações precisam chegar à recepção para que o cliente não repita tudo?',
  ],
  proxima_acao_comercial: {
    acao: 'Validar o diagnóstico com a pessoa responsável pela recepção.',
    porque: 'A conversa confirma os atritos observados e define quais campos entram no piloto.',
  },
});

const DIAGNOSTICO: DiagnosticoCompleto = {
  id: '11111111-1111-4111-8111-111111111111',
  status: 'concluido',
  canal: 'whatsapp',
  notaGeral: 62,
  solicitadoEm: '2026-08-08T12:00:00Z',
  iniciadoEm: '2026-08-08T12:00:04Z',
  concluidoEm: '2026-08-08T12:01:10Z',
  atualizadoEm: '2026-08-08T12:01:10Z',
  empresaId: '22222222-2222-4222-8222-222222222222',
  oportunidadeId: '33333333-3333-4333-8333-333333333333',
  empresa: 'Clínica Aurora',
  contato: 'Camila Rios',
  oportunidade: 'Automação do atendimento',
  proximaAcaoAtual: null,
  siteUrl: 'https://clinicaaurora.com.br',
  cenario: 'Cliente novo deseja confirmar convênio e agendar a primeira consulta.',
  temEvidenciaInformada: true,
  relatorio: RELATORIO,
  fontes: [
    { tipo: 'crm', titulo: 'Histórico da oportunidade', status: 'lida' },
    { tipo: 'site', titulo: 'Clínica Aurora', url: 'https://example.com', status: 'lida' },
    { tipo: 'site', titulo: 'Contato', url: 'https://example.com/contato', status: 'lida' },
    { tipo: 'conversa', titulo: 'Conversa autorizada', status: 'informada' },
  ],
  erro: null,
};

export default async function PreviewDiagnosticoPage({
  searchParams,
}: PageProps<'/preview/diagnostico'>) {
  if (process.env.NODE_ENV === 'production') notFound();
  const parametros = await searchParams;
  const emAndamento = parametros.estado === 'processando';

  return (
    <div className={shell.shell}>
      <aside className={shell.sidebar}>
        <div className={shell.logo}>
          <SubidoLogo size={18} />
        </div>
        <nav aria-label="Preview da navegação">
          <span>
            <House size={18} aria-hidden="true" /> Início
          </span>
          <span>
            <ContactRound size={18} aria-hidden="true" /> CRM
          </span>
          <span>
            <FileSignature size={18} aria-hidden="true" /> Propostas
          </span>
          <span>
            <Video size={18} aria-hidden="true" /> Calls
          </span>
          <a className={shell.ativo} href="#conteudo">
            <ScanSearch size={18} aria-hidden="true" /> Diagnósticos
          </a>
          <span>
            <BriefcaseBusiness size={18} aria-hidden="true" /> Projetos
          </span>
          <span>
            <GraduationCap size={18} aria-hidden="true" /> Formações
          </span>
          <span>
            <DraftingCompass size={18} aria-hidden="true" /> Estúdio
          </span>
          <span>
            <Bot size={18} aria-hidden="true" /> Sobral AI
          </span>
        </nav>
      </aside>
      <main id="conteudo" className={`${shell.conteudo} ${styles.conteudo}`}>
        {emAndamento ? (
          <ExecutorDiagnostico id={DIAGNOSTICO.id} status="na_fila" automatico={false} />
        ) : (
          <PainelRelatorio diagnostico={DIAGNOSTICO} />
        )}
      </main>
    </div>
  );
}
