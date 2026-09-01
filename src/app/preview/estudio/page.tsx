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
        <Compositor
          projetosBase={[
            {
              id: '11111111-1111-4111-8111-111111111111',
              slug: 'sdr-atendimento-qualificacao',
              titulo: 'SDR de Atendimento e Qualificação',
              resumo: 'Atendimento conectado e rastreável.',
              resultado: 'Responder, qualificar e encaminhar os contatos certos.',
            },
          ]}
          oportunidades={[
            {
              id: '22222222-2222-4222-8222-222222222222',
              titulo: 'Automação do primeiro atendimento',
              empresa: 'Clínica Aurora',
              contato: 'Camila Rios',
            },
          ]}
          projetoInicialId="11111111-1111-4111-8111-111111111111"
          oportunidadeInicialId="22222222-2222-4222-8222-222222222222"
        />
      </main>
    </div>
  );
}
