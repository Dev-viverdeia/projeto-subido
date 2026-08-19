import {
  Bot,
  BriefcaseBusiness,
  ContactRound,
  GraduationCap,
  House,
  UsersRound,
  Video,
} from 'lucide-react';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import shell from '../mapa-jornada/preview.module.css';

export function PreviewSidebar() {
  return (
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
  );
}
