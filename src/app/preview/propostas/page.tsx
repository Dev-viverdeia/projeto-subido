import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  Bot,
  BriefcaseBusiness,
  ContactRound,
  FileSignature,
  GraduationCap,
  House,
  UsersRound,
  Video,
} from 'lucide-react';
import { PainelPropostas } from '@/app/(app)/propostas/_components/PainelPropostas';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import type { ResumoProposta } from '@/lib/propostas/queries';
import styles from '../mapa-jornada/preview.module.css';

export const metadata: Metadata = { title: 'Preview · Propostas' };

const PROPOSTAS: ResumoProposta[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    titulo: 'Automação do atendimento da Clínica Aurora',
    status: 'rascunho',
    versao: 2,
    atualizadoEm: '2026-08-08T18:00:00.000Z',
    criadoEm: '2026-08-07T18:00:00.000Z',
    empresa: 'Clínica Aurora',
    projeto: 'Atendimento com IA',
    valorCentavos: 1850000,
    compartilhadaEm: null,
    ultimaVisualizacaoEm: null,
    visualizacoes: 0,
    decididaEm: null,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    titulo: 'Qualificação comercial para Moura Imóveis',
    status: 'apresentada',
    versao: 1,
    atualizadoEm: '2026-08-07T20:00:00.000Z',
    criadoEm: '2026-08-05T18:00:00.000Z',
    empresa: 'Moura Imóveis',
    projeto: 'Máquina de leads',
    valorCentavos: 2400000,
    compartilhadaEm: '2026-08-07T20:00:00.000Z',
    ultimaVisualizacaoEm: '2026-08-08T10:30:00.000Z',
    visualizacoes: 3,
    decididaEm: null,
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    titulo: 'Copiloto de vendas da Orbe',
    status: 'aceita',
    versao: 3,
    atualizadoEm: '2026-08-06T18:00:00.000Z',
    criadoEm: '2026-08-01T18:00:00.000Z',
    empresa: 'Orbe Contabilidade',
    projeto: 'Copiloto de vendas',
    valorCentavos: 3200000,
    compartilhadaEm: '2026-08-04T18:00:00.000Z',
    ultimaVisualizacaoEm: '2026-08-06T14:00:00.000Z',
    visualizacoes: 4,
    decididaEm: '2026-08-06T18:00:00.000Z',
  },
];

export default function PreviewPropostasPage() {
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
            <ContactRound size={18} strokeWidth={1.7} aria-hidden="true" /> Vendas
          </span>
          <span>
            <Video size={18} strokeWidth={1.7} aria-hidden="true" /> Reuniões
          </span>
          <a className={styles.ativo} href="#conteudo">
            <FileSignature size={18} strokeWidth={1.7} aria-hidden="true" /> Propostas
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
        <PainelPropostas propostas={PROPOSTAS} />
      </main>
    </div>
  );
}
