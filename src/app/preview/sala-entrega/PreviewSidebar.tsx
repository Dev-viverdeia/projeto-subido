import {
  Bot,
  BriefcaseBusiness,
  ContactRound,
  FileSignature,
  FolderKanban,
  House,
  Video,
} from 'lucide-react';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import styles from '../mapa-jornada/preview.module.css';

export function PreviewSidebar() {
  return (
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
          <FileSignature size={18} strokeWidth={1.7} aria-hidden="true" /> Propostas
        </span>
        <a className={styles.ativo} href="#conteudo">
          <BriefcaseBusiness size={18} strokeWidth={1.7} aria-hidden="true" /> Entregas
        </a>
        <span>
          <FolderKanban size={18} strokeWidth={1.7} aria-hidden="true" /> Estúdio
        </span>
        <span>
          <Bot size={18} strokeWidth={1.7} aria-hidden="true" /> Sobral AI
        </span>
      </nav>
    </aside>
  );
}
