import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { SolucaoBuilder } from '@/lib/builder/queries';
import { SalaDoProjeto } from '@/app/(app)/builder/_components/sala/SalaDoProjeto';
import styles from './preview.module.css';

export const metadata: Metadata = { title: 'Preview · Sala do Estúdio' };

const documento = {
  etapas: [
    { titulo: 'Mapear o atendimento', descricao: 'Entender o processo atual.', ferramentas: [] },
    { titulo: 'Construir o fluxo', descricao: 'Implementar a primeira versão.', ferramentas: [] },
    { titulo: 'Validar com a equipe', descricao: 'Testar antes da entrega.', ferramentas: [] },
  ],
} as unknown as NonNullable<SolucaoBuilder['documento']>;

const projeto: SolucaoBuilder = {
  id: 'preview-estudio',
  titulo: 'Atendimento e qualificação com IA',
  ideiaOriginal: 'Reduzir o tempo de resposta e organizar a qualificação dos novos contatos.',
  respostas: [],
  documento,
  documentoIlegivel: false,
  status: 'pronta',
  erro: null,
  modelo: 'preview',
  criadoEm: '2026-09-01T12:00:00.000Z',
  oportunidadeId: null,
  projetoBaseId: null,
  stack: null,
  tarefas: { 0: 'feito' },
};

export default function PreviewSalaEstudioPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <main className={styles.pagina}>
      <SalaDoProjeto
        solucao={projeto}
        criacao={
          <PreviewPainel titulo="Plano preparado" texto="O escopo está pronto para revisão." />
        }
        entender={
          <PreviewPainel
            titulo="O que este projeto resolve"
            texto="Organiza o primeiro atendimento, qualifica cada contato e registra o próximo passo."
          />
        }
        kit={
          <PreviewPainel
            titulo="Escolha onde construir"
            texto="Selecione a stack antes de começar a execução."
          />
        }
        construir={<PreviewPainel titulo="Execução" texto="Três etapas organizadas no quadro." />}
      />
    </main>
  );
}

function PreviewPainel({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className={styles.conteudo}>
      <h2>{titulo}</h2>
      <p>{texto}</p>
    </div>
  );
}
