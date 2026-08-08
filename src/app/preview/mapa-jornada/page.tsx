import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  Bot,
  BriefcaseBusiness,
  ClipboardCheck,
  DraftingCompass,
  FileText,
  GraduationCap,
  House,
  UsersRound,
} from 'lucide-react';
import { ConfiguracaoJornada } from '@/app/(app)/inicio/_components/ConfiguracaoJornada';
import { MapaJornada } from '@/app/(app)/inicio/_components/MapaJornada';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import { montarPlanoJornada } from '@/lib/jornada/motor';
import styles from './preview.module.css';

export const metadata: Metadata = { title: 'Preview · Mapa da jornada' };

const PROJETOS = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    slug: 'atendimento-com-ia',
    titulo: 'Atendimento com IA',
    resumo: 'Estruture triagem, respostas e passagem para a equipe com contexto.',
    categoria: 'Atendimento',
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    slug: 'maquina-de-leads',
    titulo: 'Máquina de leads',
    resumo: 'Organize captura, qualificação e priorização comercial.',
    categoria: 'Leads',
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    slug: 'copiloto-de-vendas',
    titulo: 'Copiloto de vendas',
    resumo: 'Apoie descoberta, follow-up e preparo de propostas.',
    categoria: 'Vendas',
  },
  {
    id: '00000000-0000-4000-8000-000000000004',
    slug: 'conteudo-operacional',
    titulo: 'Conteúdo operacional',
    resumo: 'Transforme repertório da empresa em produção assistida.',
    categoria: 'Marketing',
  },
];

const PLANO = montarPlanoJornada({
  perfil: null,
  aprendizado: {
    aulasConcluidas: 8,
    formacoesConcluidas: 1,
    etapasConcluidas: 4,
    projetosConcluidos: 0,
  },
  oportunidades: { total: 1, comProximaAcao: 1, ganhas: 0 },
  calls: { descobertasConcluidas: 1, kickoffsConcluidos: 0, entregasConcluidas: 0 },
  diagnosticosConcluidos: 1,
  propostas: { total: 1, apresentadas: 0, aceitas: 0 },
});

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
          <span>
            <Bot size={18} strokeWidth={1.7} aria-hidden="true" /> Sobral AI
          </span>
        </nav>
        <div className={styles.perfil}>
          <span>MM</span>
          <div>
            <strong>Mateus Milagre</strong>
            <small>Plano Profissional</small>
          </div>
        </div>
      </aside>
      <main id="conteudo" className={styles.conteudo}>
        <MapaJornada
          configuracao={<ConfiguracaoJornada perfil={null} projetos={PROJETOS} />}
          nome="Mateus"
          espacoDeTrabalho="Mateus Milagre — Consultoria"
          cliente="Clínica Aurora"
          contato="Dra. Camila Rios"
          proximaAcao="Apresentar proposta na quinta-feira"
          proximaMentoria="Chamada de alinhamento"
          oferta={null}
          nicho={null}
          diagnosticoSobral="A operação já tem uma descoberta e um diagnóstico registrados, mas ainda não declarou qual oferta será o ponto de partida."
          focoSobral="Definir a primeira oferta"
          plano={PLANO}
        />
      </main>
    </div>
  );
}
