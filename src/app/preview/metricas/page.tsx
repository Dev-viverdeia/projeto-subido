import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  Bot,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  ContactRound,
  FileSignature,
  GraduationCap,
  House,
  Search,
  UsersRound,
  Video,
} from 'lucide-react';
import { PainelMetricas } from '@/app/(app)/metricas/_components/PainelMetricas';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import { montarMetricasComerciais, type FonteMetricasComerciais } from '@/lib/metricas/modelo';
import styles from '../mapa-jornada/preview.module.css';

export const metadata: Metadata = { title: 'Preview · Métricas' };

const AGORA = new Date('2026-08-21T15:00:00.000Z');

function iso(diasAtras: number): string {
  return new Date(AGORA.getTime() - diasAtras * 86_400_000).toISOString();
}

const FONTE: FonteMetricasComerciais = {
  leads: Array.from({ length: 42 }, (_, indice) => ({
    criadoEm: iso(27 - (indice % 26)),
    ultimoContatoEm: indice < 24 ? iso(20 - (indice % 18)) : null,
    tentativasContato: indice < 24 ? 1 + (indice % 2) : 0,
  })),
  oportunidades: [
    ...Array.from({ length: 4 }, (_, indice) => ({
      criadoEm: iso(18 - indice),
      etapa: indice % 2 === 0 ? 'descoberta' : 'proposta',
      valorCentavos: 1_800_000 + indice * 300_000,
      proximaAcao: indice === 0 ? null : 'Fazer follow-up com o cliente',
      ganhaEm: null,
      perdidaEm: null,
      motivoPerda: null,
    })),
    ...Array.from({ length: 3 }, (_, indice) => ({
      criadoEm: iso(24 - indice),
      etapa: 'ganho',
      valorCentavos: 2_000_000 + indice * 450_000,
      proximaAcao: null,
      ganhaEm: iso(12 - indice * 3),
      perdidaEm: null,
      motivoPerda: null,
    })),
    {
      criadoEm: iso(22),
      etapa: 'perdido',
      valorCentavos: 1_650_000,
      proximaAcao: null,
      ganhaEm: null,
      perdidaEm: iso(7),
      motivoPerda: 'preco',
    },
    {
      criadoEm: iso(20),
      etapa: 'perdido',
      valorCentavos: 2_200_000,
      proximaAcao: null,
      ganhaEm: null,
      perdidaEm: iso(4),
      motivoPerda: 'sem_prioridade',
    },
  ],
  propostas: [
    { status: 'aceita', apresentadaEm: iso(14) },
    { status: 'aceita', apresentadaEm: iso(12) },
    { status: 'aceita', apresentadaEm: iso(8) },
    { status: 'apresentada', apresentadaEm: iso(5) },
    { status: 'apresentada', apresentadaEm: iso(2) },
    { status: 'recusada', apresentadaEm: iso(9) },
  ],
  calls: Array.from({ length: 7 }, (_, indice) => ({
    status: 'concluida',
    encerradaEm: iso(18 - indice * 2),
  })),
};

export default function PreviewMetricasPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  const metricas = montarMetricasComerciais(FONTE, '30d', AGORA);

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
          <a className={styles.ativo} href="#conteudo">
            <ChartNoAxesCombined size={18} strokeWidth={1.7} aria-hidden="true" /> Métricas
          </a>
          <span>
            <Video size={18} strokeWidth={1.7} aria-hidden="true" /> Reuniões
          </span>
          <span>
            <FileSignature size={18} strokeWidth={1.7} aria-hidden="true" /> Propostas
          </span>
        </nav>
      </aside>

      <main id="conteudo" className={styles.conteudo}>
        <PainelMetricas metricas={metricas} />
      </main>
    </div>
  );
}
