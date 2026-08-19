import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Bot,
  BriefcaseBusiness,
  ContactRound,
  GraduationCap,
  House,
  UsersRound,
  Video,
} from 'lucide-react';
import { CabecalhoDossie } from '@/app/(app)/crm/[id]/_components/CabecalhoDossie';
import { JornadaEntradaLead } from '@/app/(app)/crm/[id]/_components/JornadaEntradaLead';
import { PesquisaComercial } from '@/app/(app)/crm/[id]/_components/PesquisaComercial';
import { ResumoOperacionalLead } from '@/app/(app)/crm/[id]/_components/ResumoOperacionalLead';
import pagina from '@/app/(app)/crm/[id]/pagina.module.css';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import type { DossieLead } from '@/lib/crm/queries';
import shell from '../mapa-jornada/preview.module.css';

export const metadata: Metadata = { title: 'Preview · Oportunidade do CRM' };

const LEAD_OPERACIONAL: DossieLead = {
  oportunidade: {
    id: '11111111-1111-4111-8111-111111111111',
    titulo: 'Automação do atendimento',
    etapa: 'descoberta',
    empresaId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    empresa: 'Clínica Aurora',
    dominio: 'clinicaaurora.com.br',
    enriquecidoEm: '2026-08-08T18:10:00.000Z',
    enriquecimentoStatus: 'concluido',
    contatoId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    contato: 'Camila Rios',
    contatoEmail: 'camila@clinicaaurora.com.br',
    valorCentavos: null,
    proximaAcao: 'Apresentar o diagnóstico do piloto para a diretoria.',
    proximaAcaoEm: '2026-08-12T15:00:00.000Z',
    ganhaEm: null,
    perdidaEm: null,
    motivoPerda: null,
    ultimoFato: 'Call de descoberta concluída',
    ultimoFatoEm: '2026-08-08T17:44:00.000Z',
    atualizadoEm: '2026-08-08T17:46:00.000Z',
    criadoEm: '2026-08-03T13:00:00.000Z',
  },
  empresa: {
    nome: 'Clínica Aurora',
    dominio: 'clinicaaurora.com.br',
    setor: 'Saúde',
    porte: 'Médio',
    cidade: 'São Paulo',
    estado: 'SP',
  },
  contato: {
    nome: 'Camila Rios',
    email: 'camila@clinicaaurora.com.br',
    telefone: '+55 11 99999-0000',
    cargo: 'Diretora de Operações',
    linkedinUrl: 'https://www.linkedin.com/in/camila-rios',
  },
  eventos: [
    {
      id: 'evento-2',
      titulo: 'Pesquisa comercial atualizada',
      descricao: 'Site público e histórico do CRM foram consultados novamente.',
      tipo: 'enriquecimento',
      ocorridoEm: '2026-08-08T18:10:00.000Z',
      fonte: 'Pesquisa comercial',
    },
    {
      id: 'evento-1',
      titulo: 'Call de descoberta concluída',
      descricao: 'Problemas, decisão e próximos passos entraram no contexto da oportunidade.',
      tipo: 'call_concluida',
      ocorridoEm: '2026-08-08T17:44:00.000Z',
      fonte: 'Calls',
    },
    {
      id: 'evento-3',
      titulo: 'Oportunidade entrou no pipeline',
      descricao: 'Contato recebido por indicação de um cliente.',
      tipo: 'lead_criado',
      ocorridoEm: '2026-08-03T13:00:00.000Z',
      fonte: 'CRM',
    },
  ],
  calls: [
    {
      id: '22222222-2222-4222-8222-222222222222',
      titulo: 'Descoberta do atendimento',
      tipo: 'descoberta',
      status: 'concluida',
      agendadaPara: '2026-08-08T17:00:00.000Z',
      iniciadaEm: '2026-08-08T17:02:00.000Z',
      encerradaEm: '2026-08-08T17:44:00.000Z',
      duracaoMinutos: 45,
      codigoPublico: 'preview-descoberta',
    },
    {
      id: '33333333-3333-4333-8333-333333333333',
      titulo: 'Apresentação do diagnóstico',
      tipo: 'follow_up',
      status: 'agendada',
      agendadaPara: '2026-08-12T15:00:00.000Z',
      iniciadaEm: null,
      encerradaEm: null,
      duracaoMinutos: 30,
      codigoPublico: 'preview-follow-up',
    },
  ],
  acoesPlano: [
    {
      id: '55555555-5555-4555-8555-555555555555',
      titulo: 'Apresentar o diagnóstico do piloto para a diretoria.',
      prazoEm: '2026-08-12T15:00:00.000Z',
      reuniaoId: '33333333-3333-4333-8333-333333333333',
    },
  ],
  projetoAtivo: null,
  projetoRecente: null,
  propostaRecente: null,
  enriquecimentos: [
    {
      id: '88888888-8888-4888-8888-888888888888',
      status: 'concluido',
      dominio: 'clinicaaurora.com.br',
      linkedinUrl: 'https://www.linkedin.com/in/camila-rios',
      erro: null,
      solicitadoEm: '2026-08-08T18:08:00.000Z',
      concluidoEm: '2026-08-08T18:10:00.000Z',
      dossie: {
        resumo:
          'A clínica concentra o atendimento no WhatsApp e já sente demora nos horários de pico. A próxima conversa precisa medir volume, tempo de resposta e impacto no agendamento antes de definir o piloto.',
        empresa: {
          setor: 'Saúde',
          porte: 'Médio',
          cidade: 'São Paulo',
          estado: 'SP',
          modeloNegocio: 'Clínica particular com atendimento e agendamento direto ao paciente.',
        },
        fatos: [
          {
            titulo: 'WhatsApp é o principal canal',
            valor: 'O canal aparece em destaque nas páginas de atendimento e agendamento.',
            origem: 'site',
            urlFonte: 'https://clinicaaurora.com.br',
          },
          {
            titulo: 'Demora em horários de pico',
            valor: 'A diretora relatou mensagens acumuladas no início da manhã e no fim da tarde.',
            origem: 'crm',
          },
          {
            titulo: 'Quatro especialidades anunciadas',
            valor: 'O site lista dermatologia, estética, nutrição e fisioterapia.',
            origem: 'site',
            urlFonte: 'https://clinicaaurora.com.br/especialidades',
          },
        ],
        hipoteses: [
          {
            titulo: 'A recepção repete perguntas de triagem',
            explicacao: 'O site não coleta o motivo da consulta antes de abrir o WhatsApp.',
            confianca: 'media',
            comoValidar: 'Pergunte quais dados são coletados antes de oferecer um horário.',
          },
          {
            titulo: 'Há perda de demanda fora do horário',
            explicacao: 'Não há informação pública sobre resposta automática ou prazo de retorno.',
            confianca: 'baixa',
            comoValidar: 'Compare volume e conversão por horário durante uma semana.',
          },
        ],
        oportunidades: [
          {
            titulo: 'SDR de atendimento com IA',
            impacto: 'Responder, qualificar e encaminhar pacientes com contexto.',
            porQueAgora: 'A operação já concentra demanda em um canal e relata demora.',
            abertura:
              'Quanto tempo a recepção leva hoje entre a primeira mensagem e o agendamento?',
          },
          {
            titulo: 'Follow-up automático',
            impacto: 'Retomar conversas que não viraram agendamento.',
            porQueAgora: 'O volume e o abandono ainda precisam ser medidos.',
            abertura: 'O que acontece com quem pede horário e não responde na sequência?',
          },
        ],
        perguntasDescoberta: [
          'Quantas conversas novas chegam pelo WhatsApp por dia?',
          'O que a recepção precisa perguntar antes de sugerir um horário?',
          'Em quais horários as mensagens mais se acumulam?',
          'Como vocês acompanham conversas que não viraram agendamento?',
        ],
        proximaAcao: {
          acao: 'Medir uma semana de conversas antes de definir o piloto.',
          porque: 'O volume e os gargalos precisam ser confirmados para dimensionar a automação.',
        },
        alertas: ['O volume de mensagens ainda não foi confirmado em fonte ou call registrada.'],
      },
      fontes: [
        { tipo: 'crm', titulo: 'CRM e calls', status: 'lida' },
        {
          tipo: 'site',
          titulo: 'Site da Clínica Aurora',
          url: 'https://clinicaaurora.com.br',
          status: 'lida',
        },
        {
          tipo: 'linkedin',
          titulo: 'LinkedIn de Camila Rios',
          url: 'https://www.linkedin.com/in/camila-rios',
          status: 'referencia',
        },
      ],
    },
  ],
  totalCalls: 2,
};

const LEAD_NOVO: DossieLead = {
  ...LEAD_OPERACIONAL,
  oportunidade: {
    ...LEAD_OPERACIONAL.oportunidade,
    etapa: 'novo_lead',
    dominio: null,
    enriquecidoEm: null,
    enriquecimentoStatus: null,
    proximaAcao: null,
    proximaAcaoEm: null,
    ultimoFato: 'Oportunidade entrou no pipeline',
    ultimoFatoEm: LEAD_OPERACIONAL.oportunidade.criadoEm,
  },
  empresa: { ...LEAD_OPERACIONAL.empresa, dominio: null },
  eventos: [LEAD_OPERACIONAL.eventos[2]!],
  calls: [],
  acoesPlano: [],
  enriquecimentos: [],
  totalCalls: 0,
};

export default async function PreviewDossiePage({
  searchParams,
}: PageProps<'/preview/crm-dossie'>) {
  if (process.env.NODE_ENV === 'production') notFound();
  const parametros = await searchParams;
  const entrada = parametros.entrada === '1';
  const lead = entrada ? LEAD_NOVO : LEAD_OPERACIONAL;
  const execucao = LEAD_OPERACIONAL.enriquecimentos[0]!;

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
          <a className={shell.ativo} href="#conteudo">
            <ContactRound size={18} aria-hidden="true" /> CRM
          </a>
          <span>
            <Video size={18} aria-hidden="true" /> Calls
          </span>
          <span>
            <BriefcaseBusiness size={18} aria-hidden="true" /> Projetos
          </span>
          <span>
            <GraduationCap size={18} aria-hidden="true" /> Formações
          </span>
          <span>
            <Bot size={18} aria-hidden="true" /> Sobral AI
          </span>
          <span>
            <UsersRound size={18} aria-hidden="true" /> Mentorias
          </span>
        </nav>
      </aside>

      <main id="conteudo" className={shell.conteudo}>
        <div className={pagina.pagina}>
          <span className={pagina.voltar}>
            <ArrowLeft size={15} aria-hidden="true" /> Voltar ao pipeline
          </span>
          <CabecalhoDossie
            lead={lead}
            enriquecimentoEmAndamento={false}
            temDossie={!entrada}
            modoEntrada={entrada}
          />

          {entrada ? (
            <JornadaEntradaLead
              oportunidadeId={lead.oportunidade.id}
              empresaNome={lead.empresa.nome}
              dominio={lead.empresa.dominio}
              linkedin={lead.contato?.linkedinUrl ?? null}
              estadoContexto="pendente"
              totalCalls={0}
            />
          ) : (
            <>
              <ResumoOperacionalLead lead={lead} />
              <PesquisaComercial lead={lead} execucao={execucao} dossie={execucao.dossie!} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
