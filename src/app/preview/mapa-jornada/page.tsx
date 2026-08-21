import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  BriefcaseBusiness,
  ClipboardCheck,
  DraftingCompass,
  FileText,
  GraduationCap,
  House,
  UsersRound,
} from 'lucide-react';
import { MapaJornada } from '@/app/(app)/inicio/_components/MapaJornada';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import styles from './preview.module.css';

export const metadata: Metadata = { title: 'Preview · Mapa da jornada' };

/**
 * Bancada visual local para comparar a implementação com a direção aprovada.
 * Em produção esta URL encerra em 404; o produto real usa o mesmo componente em
 * /inicio, protegido por sessão e abastecido com os dados do usuário.
 */
export default function PreviewMapaJornadaPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <SubidoLogo size={18} />
        </div>
        <nav aria-label="Preview da navegação">
          <a className={styles.ativo} href="#conteudo">
            <House size={18} strokeWidth={1.7} aria-hidden="true" /> Início
          </a>
          <span>
            <UsersRound size={18} strokeWidth={1.7} aria-hidden="true" /> Leads
          </span>
          <span>
            <FileText size={18} strokeWidth={1.7} aria-hidden="true" /> Propostas
          </span>
          <span>
            <BriefcaseBusiness size={18} strokeWidth={1.7} aria-hidden="true" /> Projetos
          </span>
          <span>
            <ClipboardCheck size={18} strokeWidth={1.7} aria-hidden="true" /> Entregas
          </span>
          <span>
            <GraduationCap size={18} strokeWidth={1.7} aria-hidden="true" /> Formações
          </span>
          <span>
            <DraftingCompass size={18} strokeWidth={1.7} aria-hidden="true" /> Estúdio
          </span>
        </nav>
        <div className={styles.perfil}>
          <span>MM</span>
          <div>
            <strong>Mateus Milagre</strong>
            <small>Profissional de IA</small>
          </div>
        </div>
      </aside>
      <main id="conteudo" className={styles.conteudo}>
        <MapaJornada
          nome="Mateus"
          cliente="Clínica Aurora"
          contato="Dra. Camila Rios"
          proximaAcao="Apresentar proposta na quinta-feira"
          proximaMentoria="Chamada de alinhamento"
        />
      </main>
    </div>
  );
}
