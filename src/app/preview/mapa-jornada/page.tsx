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
import { PrioridadeOperacional } from '@/app/(app)/inicio/_components/PrioridadeOperacional';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import { montarPlanoJornada } from '@/lib/jornada/motor';
import styles from './preview.module.css';

export const metadata: Metadata = { title: 'Preview · Mapa da jornada' };

const planoPreview = montarPlanoJornada({
  perfil: null,
  aprendizado: {
    aulasConcluidas: 4,
    formacoesConcluidas: 1,
    etapasConcluidas: 0,
    projetosConcluidos: 1,
  },
  oportunidades: { total: 1, enriquecidas: 1, comProximaAcao: 0, ganhas: 0 },
  calls: { descobertasConcluidas: 0, kickoffsConcluidos: 0, entregasConcluidas: 0 },
  propostas: { total: 0, apresentadas: 0, aceitas: 0 },
  entregas: {
    projetosIniciados: 0,
    projetosConcluidos: 0,
    propostaAceitaEmFocoId: null,
    projetoEmFocoId: null,
    projetoEmFocoTitulo: null,
    tarefasConcluidas: 0,
    tarefasTotal: 0,
  },
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
          plano={planoPreview}
          prioridade={
            <PrioridadeOperacional
              etapa="Prospectar"
              titulo="Defina a próxima ação"
              detalhe="Registre o que será feito e a data do próximo contato."
              evidencia="Nenhuma próxima ação registrada."
              destino="/vendas"
              acao="Definir próxima ação"
            />
          }
          proximaMentoria="Chamada de alinhamento"
        />
      </main>
    </div>
  );
}
