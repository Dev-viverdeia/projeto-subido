import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  Bot,
  BriefcaseBusiness,
  ContactRound,
  FileSignature,
  FolderKanban,
  GraduationCap,
  House,
  Search,
  UsersRound,
  Video,
} from 'lucide-react';
import { PainelEntregas } from '@/app/(app)/entregas/_components/PainelEntregas';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import type { ResumoProjetoExecucao } from '@/lib/projetos-execucao/queries';
import styles from '../mapa-jornada/preview.module.css';

export const metadata: Metadata = { title: 'Preview · Entregas' };

const PROJETOS: ResumoProjetoExecucao[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    titulo: 'Atendimento com IA para clínicas',
    empresa: 'Clínica Aurora',
    status: 'em_execucao',
    prazoEm: '2026-09-12T12:00:00.000Z',
    atualizadoEm: '2026-08-26T18:00:00.000Z',
    feitas: 7,
    total: 12,
    proximaTarefa: 'Validar o fluxo de triagem com a gerente da recepção',
    proximaAcaoPrazoEm: '2026-08-27T12:00:00.000Z',
    tarefasBloqueadas: 0,
    validacoesAguardando: 0,
    ajustesSolicitados: 0,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    titulo: 'Qualificação e follow-up comercial com IA',
    empresa: 'Grupo Horizonte',
    status: 'em_validacao',
    prazoEm: '2026-09-05T12:00:00.000Z',
    atualizadoEm: '2026-08-25T15:00:00.000Z',
    feitas: 10,
    total: 12,
    proximaTarefa: 'Enviar o relatório do piloto para aprovação do cliente',
    proximaAcaoPrazoEm: null,
    tarefasBloqueadas: 0,
    validacoesAguardando: 1,
    ajustesSolicitados: 0,
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    titulo: 'Captação de leads locais com IA',
    empresa: 'Odonto Prime',
    status: 'planejamento',
    prazoEm: null,
    atualizadoEm: '2026-08-24T12:00:00.000Z',
    feitas: 1,
    total: 9,
    proximaTarefa: 'Confirmar escopo e acessos no kickoff',
    proximaAcaoPrazoEm: null,
    tarefasBloqueadas: 0,
    validacoesAguardando: 0,
    ajustesSolicitados: 0,
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    titulo: 'Automação de propostas comerciais',
    empresa: 'Nexo Imóveis',
    status: 'concluido',
    prazoEm: '2026-08-18T12:00:00.000Z',
    atualizadoEm: '2026-08-18T18:00:00.000Z',
    feitas: 8,
    total: 8,
    proximaTarefa: null,
    proximaAcaoPrazoEm: null,
    tarefasBloqueadas: 0,
    validacoesAguardando: 0,
    ajustesSolicitados: 0,
  },
];

export default function PreviewEntregasPage() {
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
            <Bot size={18} strokeWidth={1.7} aria-hidden="true" /> Sobral AI
          </span>
          <span>
            <GraduationCap size={18} strokeWidth={1.7} aria-hidden="true" /> Formações
          </span>
          <span>
            <BriefcaseBusiness size={18} strokeWidth={1.7} aria-hidden="true" /> Projetos
          </span>
          <span>
            <UsersRound size={18} strokeWidth={1.7} aria-hidden="true" /> Mentorias
          </span>
          <span>
            <Search size={18} strokeWidth={1.7} aria-hidden="true" /> Prospecção
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
            <FolderKanban size={18} strokeWidth={1.7} aria-hidden="true" /> Entregas
          </a>
        </nav>
      </aside>

      <main id="conteudo" className={styles.conteudo}>
        <PainelEntregas projetos={PROJETOS} agora={new Date('2026-08-28T12:00:00.000Z')} />
      </main>
    </div>
  );
}
