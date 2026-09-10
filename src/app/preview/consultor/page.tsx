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
import { TelaSobral } from '@/app/(app)/consultor/_components/TelaSobral';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import styles from '../mapa-jornada/preview.module.css';

export const metadata: Metadata = { title: 'Preview · Sobral AI' };

export default async function PreviewConsultorPage({
  searchParams,
}: PageProps<'/preview/consultor'>) {
  if (process.env.NODE_ENV === 'production') notFound();
  const mostrarHistorico = (await searchParams).historico === '1';
  const threads = mostrarHistorico
    ? Array.from({ length: 40 }, (_, i) => ({
        id: `33333333-3333-4333-8333-${String(i + 1).padStart(12, '0')}`,
        titulo:
          i === 0
            ? 'Proposta para Clínica Horizonte'
            : i === 1
              ? 'Plano de entrega'
              : `Projeto de atendimento ${i + 1}`,
        criadoEm: '2026-09-09T12:00:00Z',
        atualizadoEm: '2026-09-10T12:00:00Z',
      }))
    : [];

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
        <TelaSobral
          dono="11111111-1111-4111-8111-111111111111"
          threads={threads}
          totalConversas={mostrarHistorico ? 43 : 0}
          conversa={null}
        />
      </main>
    </div>
  );
}
