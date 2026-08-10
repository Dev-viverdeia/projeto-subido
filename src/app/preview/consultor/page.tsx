import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  Bot,
  BriefcaseBusiness,
  ContactRound,
  FileText,
  GraduationCap,
  House,
  UsersRound,
  Video,
} from 'lucide-react';
import { PainelSobralView } from '@/app/(app)/consultor/_components/PainelSobral';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import { criarPlanoBase, SinaisSobralSchema } from '@/lib/consultor/direcao';
import type { PainelSobral } from '@/lib/consultor/queries';
import styles from '../mapa-jornada/preview.module.css';

export const metadata: Metadata = { title: 'Preview · Sobral AI' };

const AGORA = '2026-08-10T17:45:00.000Z';
const OPORTUNIDADE = '11111111-1111-4111-8111-111111111111';
const PROPOSTA = '22222222-2222-4222-8222-222222222222';
const CALL = '33333333-3333-4333-8333-333333333333';
const PROJETO = '44444444-4444-4444-8444-444444444444';

const SINAIS = SinaisSobralSchema.parse({
  momento: AGORA,
  oportunidades: {
    total: 3,
    abertas: 2,
    semProximaAcao: 0,
    emDescoberta: 1,
    emPropostaOuNegociacao: 1,
    ganhas: 1,
  },
  calls: { total: 4, agendadas: 1, concluidas: 2 },
  propostas: { total: 2, rascunhos: 0, prontas: 0, apresentadas: 1, aceitas: 1 },
  studio: { total: 1, prontos: 1 },
  projetos: { total: 1, ativos: 1, acoesPendentes: 2, acoesAtrasadas: 1 },
  radar: [
    {
      id: `propostas-${PROPOSTA}`,
      dominio: 'propostas',
      titulo: 'Conduzir o follow-up da proposta',
      contexto: 'Clínica Aurora',
      momento: 'Aguardando decisão',
      estado: 'aguardando',
      destino: `/propostas/${PROPOSTA}`,
      prioridade: 106,
    },
    {
      id: `crm-${OPORTUNIDADE}`,
      dominio: 'crm',
      titulo: 'Confirmar decisor e data da decisão',
      contexto: 'Clínica Aurora · Negociação',
      momento: 'Atrasado desde 09 ago',
      estado: 'atrasado',
      destino: `/crm/${OPORTUNIDADE}`,
      prioridade: 102,
    },
    {
      id: `calls-${CALL}`,
      dominio: 'calls',
      titulo: 'Apresentação do escopo revisado',
      contexto: 'Orbe Contabilidade · Proposta',
      momento: 'Hoje · 16:30',
      estado: 'hoje',
      destino: `/calls/${CALL}`,
      prioridade: 100,
    },
    {
      id: `projetos-${PROJETO}`,
      dominio: 'projetos',
      titulo: 'Validar base de conhecimento',
      contexto: 'Atendimento inteligente · Clínica Aurora',
      momento: '12 ago · 10:00',
      estado: 'agendado',
      destino: `/solucoes/execucao/${PROJETO}`,
      prioridade: 80,
    },
  ],
  catalogo: [
    {
      slug: 'atendimento-inteligente',
      titulo: 'Atendimento inteligente',
      categoria: 'Atendimento',
    },
    { slug: 'motor-de-leads', titulo: 'Motor de leads', categoria: 'Marketing' },
  ],
  foco: {
    oportunidadeId: OPORTUNIDADE,
    titulo: 'Atendimento com IA',
    empresa: 'Clínica Aurora',
    etapa: 'negociacao',
    proximaAcao: 'Confirmar decisor e data da decisão',
    proximaAcaoEm: '2026-08-09T17:00:00.000Z',
  },
});

const PAINEL: PainelSobral = {
  plano: criarPlanoBase(SINAIS),
  sinais: SINAIS,
  geradoPorIA: false,
  desatualizado: false,
};

export default function PreviewConsultorPage() {
  if (process.env.NODE_ENV === 'production') notFound();

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
            <ContactRound size={18} strokeWidth={1.7} aria-hidden="true" /> CRM
          </span>
          <span>
            <Video size={18} strokeWidth={1.7} aria-hidden="true" /> Calls
          </span>
          <span>
            <FileText size={18} strokeWidth={1.7} aria-hidden="true" /> Propostas
          </span>
          <span>
            <BriefcaseBusiness size={18} strokeWidth={1.7} aria-hidden="true" /> Projetos
          </span>
          <span>
            <GraduationCap size={18} strokeWidth={1.7} aria-hidden="true" /> Formações
          </span>
          <a className={styles.ativo} href="#conteudo">
            <Bot size={18} strokeWidth={1.7} aria-hidden="true" /> Sobral AI
          </a>
          <span>
            <UsersRound size={18} strokeWidth={1.7} aria-hidden="true" /> Mentorias
          </span>
        </nav>
      </aside>
      <main id="conteudo" className={styles.conteudo}>
        <PainelSobralView threads={[]} painel={PAINEL} />
      </main>
    </div>
  );
}
