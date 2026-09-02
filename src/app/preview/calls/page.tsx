import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  Bot,
  BriefcaseBusiness,
  ContactRound,
  GraduationCap,
  House,
  UsersRound,
  Video,
} from 'lucide-react';
import { PainelCalls } from '@/app/(app)/calls/_components/PainelCalls';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import type { ReuniaoCall } from '@/lib/calls/queries';
import type { OportunidadeCrm } from '@/lib/crm/queries';
import styles from '../mapa-jornada/preview.module.css';

export const metadata: Metadata = { title: 'Preview · Reuniões' };

const AGORA = '2026-08-07T18:00:00.000Z';
const OPORTUNIDADES: OportunidadeCrm[] = [
  {
    id: '22222222-2222-4222-8222-222222222222',
    titulo: 'Automação do atendimento',
    etapa: 'ganho',
    empresaId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    empresa: 'Clínica Aurora',
    dominio: 'clinicaaurora.com.br',
    enriquecidoEm: AGORA,
    enriquecimentoStatus: 'concluido',
    contatoId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    contato: 'Camila Rios',
    contatoEmail: 'camila@exemplo.com',
    valorCentavos: null,
    proximaAcao: 'Realizar kickoff do projeto',
    proximaAcaoEm: '2026-08-10T17:00:00.000Z',
    ganhaEm: null,
    perdidaEm: null,
    motivoPerda: null,
    ultimoFato: 'Reunião agendada',
    ultimoFatoEm: AGORA,
    atualizadoEm: AGORA,
    criadoEm: AGORA,
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    titulo: 'Agente de qualificação de leads',
    etapa: 'proposta',
    empresaId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    empresa: 'Moura Imóveis',
    dominio: 'mouraimoveis.com.br',
    enriquecidoEm: null,
    enriquecimentoStatus: null,
    contatoId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    contato: 'Lucas Moura',
    contatoEmail: 'lucas@exemplo.com',
    valorCentavos: null,
    proximaAcao: 'Apresentar proposta',
    proximaAcaoEm: '2026-08-12T19:30:00.000Z',
    ganhaEm: null,
    perdidaEm: null,
    motivoPerda: null,
    ultimoFato: 'Etapa da venda alterada',
    ultimoFatoEm: AGORA,
    atualizadoEm: AGORA,
    criadoEm: AGORA,
  },
];

const REUNIOES: ReuniaoCall[] = [
  {
    id: '88888888-8888-4888-8888-888888888888',
    titulo: 'Primeira conversa com a Clínica Horizonte',
    tipo: 'descoberta',
    status: 'agendada',
    agendadaPara: '2026-08-06T14:00:00.000Z',
    duracaoMinutos: 30,
    codigoPublico: '99999999-9999-4999-8999-999999999999',
    liveCoachAtivo: false,
    oportunidadeId: OPORTUNIDADES[0]!.id,
    oportunidade: OPORTUNIDADES[0]!.titulo,
    empresa: 'Clínica Horizonte',
    contato: 'Marina Lopes',
    convidadoEmail: 'marina@exemplo.com',
    googleSyncStatus: 'sincronizado',
    googleEventUrl: null,
    googleSyncErro: null,
    criadaEm: '2026-08-05T18:00:00.000Z',
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    titulo: 'Kickoff do projeto de atendimento',
    tipo: 'kickoff',
    status: 'agendada',
    agendadaPara: '2026-08-10T17:00:00.000Z',
    duracaoMinutos: 45,
    codigoPublico: '55555555-5555-4555-8555-555555555555',
    liveCoachAtivo: true,
    oportunidadeId: OPORTUNIDADES[0]!.id,
    oportunidade: OPORTUNIDADES[0]!.titulo,
    empresa: OPORTUNIDADES[0]!.empresa,
    contato: OPORTUNIDADES[0]!.contato,
    convidadoEmail: null,
    googleSyncStatus: 'nao_solicitado',
    googleEventUrl: null,
    googleSyncErro: null,
    criadaEm: AGORA,
  },
  {
    id: '66666666-6666-4666-8666-666666666666',
    titulo: 'Apresentação da proposta',
    tipo: 'proposta',
    status: 'agendada',
    agendadaPara: '2026-08-12T19:30:00.000Z',
    duracaoMinutos: 30,
    codigoPublico: '77777777-7777-4777-8777-777777777777',
    liveCoachAtivo: true,
    oportunidadeId: OPORTUNIDADES[1]!.id,
    oportunidade: OPORTUNIDADES[1]!.titulo,
    empresa: OPORTUNIDADES[1]!.empresa,
    contato: OPORTUNIDADES[1]!.contato,
    convidadoEmail: null,
    googleSyncStatus: 'nao_solicitado',
    googleEventUrl: null,
    googleSyncErro: null,
    criadaEm: AGORA,
  },
];

export default async function PreviewCallsPage({ searchParams }: PageProps<'/preview/calls'>) {
  if (process.env.NODE_ENV === 'production') notFound();
  const parametros = await searchParams;

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <SubidoLogo size={18} />
        </div>
        <nav aria-label="Preview da navegação">
          <span>
            <House size={18} strokeWidth={1.7} aria-hidden="true" /> Início
          </span>
          <span>
            <ContactRound size={18} strokeWidth={1.7} aria-hidden="true" /> Vendas
          </span>
          <a className={styles.ativo} href="#conteudo">
            <Video size={18} strokeWidth={1.7} aria-hidden="true" /> Reuniões
          </a>
          <span>
            <BriefcaseBusiness size={18} strokeWidth={1.7} aria-hidden="true" /> Projetos
          </span>
          <span>
            <GraduationCap size={18} strokeWidth={1.7} aria-hidden="true" /> Formações
          </span>
          <span>
            <Bot size={18} strokeWidth={1.7} aria-hidden="true" /> Sobral AI
          </span>
          <span>
            <UsersRound size={18} strokeWidth={1.7} aria-hidden="true" /> Mentorias
          </span>
        </nav>
      </aside>
      <main id="conteudo" className={styles.conteudo}>
        <PainelCalls
          reunioes={parametros.estado === 'vazio' ? [] : REUNIOES}
          agora={new Date(AGORA)}
          oportunidades={OPORTUNIDADES}
          calendar={{
            configurado: true,
            conectado: parametros.calendar === '1',
            email: parametros.calendar === '1' ? 'profissional@gmail.com' : null,
            status: parametros.calendar === '1' ? 'ativa' : 'desconectada',
            ultimoErro: null,
          }}
          agendadaId={
            parametros.agendada === '1' ? '66666666-6666-4666-8666-666666666666' : undefined
          }
          modalInicial={parametros.modal === '1'}
          oportunidadeInicial={
            typeof parametros.oportunidade === 'string' ? parametros.oportunidade : undefined
          }
          tipoInicial={parametros.tipo === 'kickoff' ? 'kickoff' : undefined}
        />
      </main>
    </div>
  );
}
