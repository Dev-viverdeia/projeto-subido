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
import { SobralChatVisual } from '@/app/(app)/inicio/_components/SobralChatInicio';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import { SinaisSobralSchema } from '@/lib/consultor/direcao';
import { montarPlanoJornada } from '@/lib/jornada/motor';
import { resolverPrioridadeInicio } from '@/lib/jornada/prioridade';
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

const PERFIL_PREVIEW = {
  nicho: 'Clínicas odontológicas',
  projetoInicialId: PROJETOS[0]!.id,
  projetoInicialTitulo: PROJETOS[0]!.titulo,
  projetoInicialSlug: PROJETOS[0]!.slug,
  posicionamento:
    'Implanto atendimento com IA para clínicas reduzirem o tempo de resposta sem perder o contexto.',
  atualizadoEm: '2026-08-11T12:00:00.000Z',
};

const PLANO_ATIVACAO = montarPlanoJornada({
  perfil: null,
  aprendizado: {
    aulasConcluidas: 0,
    formacoesConcluidas: 0,
    etapasConcluidas: 0,
    projetosConcluidos: 0,
  },
  oportunidades: { total: 0, enriquecidas: 0, comProximaAcao: 0, ganhas: 0 },
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

const PLANO_OPERACAO = montarPlanoJornada({
  perfil: PERFIL_PREVIEW,
  aprendizado: {
    aulasConcluidas: 12,
    formacoesConcluidas: 1,
    etapasConcluidas: 4,
    projetosConcluidos: 0,
  },
  oportunidades: { total: 1, enriquecidas: 1, comProximaAcao: 1, ganhas: 0 },
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

const PLANO_EVOLUCAO = montarPlanoJornada({
  perfil: PERFIL_PREVIEW,
  aprendizado: {
    aulasConcluidas: 12,
    formacoesConcluidas: 1,
    etapasConcluidas: 15,
    projetosConcluidos: 1,
  },
  oportunidades: { total: 2, enriquecidas: 1, comProximaAcao: 1, ganhas: 1 },
  calls: { descobertasConcluidas: 1, kickoffsConcluidos: 1, entregasConcluidas: 1 },
  propostas: { total: 1, apresentadas: 1, aceitas: 1 },
  entregas: {
    projetosIniciados: 1,
    projetosConcluidos: 1,
    propostaAceitaEmFocoId: '00000000-0000-4000-8000-000000000010',
    projetoEmFocoId: '00000000-0000-4000-8000-000000000011',
    projetoEmFocoTitulo: 'Atendimento da Clínica Aurora',
    tarefasConcluidas: 10,
    tarefasTotal: 10,
  },
});

/**
 * Bancada visual local para comparar a implementação com a direção aprovada.
 * Em produção esta URL encerra em 404; o produto real usa o mesmo componente em
 * /inicio, protegido por sessão e abastecido com os dados do usuário.
 */
export default async function PreviewMapaJornadaPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  if (process.env.NODE_ENV === 'production') notFound();
  const estado = (await searchParams).estado;
  const evolucaoAtiva = estado === 'evolucao';
  const operacaoAtiva = estado === 'operacao' || evolucaoAtiva;
  const plano = evolucaoAtiva ? PLANO_EVOLUCAO : operacaoAtiva ? PLANO_OPERACAO : PLANO_ATIVACAO;
  const sinais = SinaisSobralSchema.parse({
    momento: '2026-08-13T12:00:00.000Z',
    oportunidades: {
      total: evolucaoAtiva ? 2 : operacaoAtiva ? 1 : 0,
      abertas: operacaoAtiva ? 1 : 0,
      semProximaAcao: 0,
      emDescoberta: 0,
      emPropostaOuNegociacao: 0,
      ganhas: evolucaoAtiva ? 1 : 0,
    },
    calls: {
      total: evolucaoAtiva ? 2 : 0,
      agendadas: 0,
      concluidas: evolucaoAtiva ? 2 : 0,
    },
    propostas: {
      total: evolucaoAtiva ? 1 : 0,
      rascunhos: 0,
      prontas: 0,
      apresentadas: evolucaoAtiva ? 1 : 0,
      aceitas: evolucaoAtiva ? 1 : 0,
    },
    studio: { total: 0, prontos: 0 },
    projetos: {
      total: evolucaoAtiva ? 1 : 0,
      ativos: 0,
      acoesPendentes: 0,
      acoesAtrasadas: 0,
    },
    jornada: {
      perfilCompleto: plano.perfilCompleto,
      etapaAtual: plano.etapaAtual,
      proximoPasso: plano.proximoPasso,
      evidenciasConcluidas: plano.evidenciasConcluidas,
      totalEvidencias: plano.totalEvidencias,
      percentual: plano.percentual,
      aprendizado: operacaoAtiva
        ? {
            aulasConcluidas: 12,
            formacoesConcluidas: 1,
            etapasConcluidas: 4,
            projetosConcluidos: 0,
          }
        : {
            aulasConcluidas: 0,
            formacoesConcluidas: 0,
            etapasConcluidas: 0,
            projetosConcluidos: 0,
          },
    },
    radar: [],
    catalogo: PROJETOS.map((projeto) => ({
      slug: projeto.slug,
      titulo: projeto.titulo,
      categoria: projeto.categoria,
    })),
    foco: operacaoAtiva
      ? {
          oportunidadeId: '00000000-0000-4000-8000-000000000001',
          titulo: 'Atendimento da Clínica Aurora',
          empresa: 'Clínica Aurora',
          etapa: 'qualificacao',
          proximaAcao: 'Agendar descoberta',
          proximaAcaoEm: null,
        }
      : null,
  });
  const prioridade = resolverPrioridadeInicio(plano, sinais);

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
          sobral={
            <SobralChatVisual
              mensagens={[]}
              exemplos={[
                { rotulo: 'O que faço agora?', texto: 'O que devo fazer agora?' },
                { rotulo: 'Indique uma aula', texto: 'Qual aula pode me ajudar agora?' },
                {
                  rotulo: 'Escolha uma ferramenta',
                  texto: 'Qual ferramenta faz sentido para o meu próximo passo?',
                },
              ]}
            />
          }
          prioridade={
            <PrioridadeOperacional
              modo={prioridade.modo}
              etapa={prioridade.etapa}
              foco={prioridade.foco}
              titulo={prioridade.titulo}
              detalhe={prioridade.detalhe}
              rotuloEvidencia={prioridade.rotuloEvidencia}
              evidencia={prioridade.evidencia}
              destino={prioridade.destino}
              acao={prioridade.acao}
            />
          }
          cliente="Clínica Aurora"
          contato="Dra. Camila Rios"
          proximaAcao="Apresentar proposta na quinta-feira"
          proximaMentoria="Chamada de alinhamento"
          plano={plano}
        />
      </main>
    </div>
  );
}
