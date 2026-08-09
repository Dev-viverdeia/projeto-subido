import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Bot, ContactRound, DraftingCompass, FileSignature, House, Video } from 'lucide-react';
import { Compositor } from '@/app/(app)/builder/_components/Compositor';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import styles from '../mapa-jornada/preview.module.css';

export const metadata: Metadata = { title: 'Preview · Estúdio' };

export default function PreviewEstudioPage() {
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
          <a className={styles.ativo} href="#conteudo">
            <DraftingCompass size={18} strokeWidth={1.7} aria-hidden="true" /> Estúdio
          </a>
          <span>
            <FileSignature size={18} strokeWidth={1.7} aria-hidden="true" /> Propostas
          </span>
          <span>
            <Bot size={18} strokeWidth={1.7} aria-hidden="true" /> Sobral AI
          </span>
        </nav>
      </aside>

      <main id="conteudo" className={styles.conteudo}>
        <Compositor />
      </main>
    </div>
  );
}
