import type { Metadata } from 'next';
import { listarThreads } from '@/lib/consultor/queries';
import { montarContextoSobralTarefa } from '@/lib/projetos-execucao/contexto-sobral';
import { obterProjetoExecucao } from '@/lib/projetos-execucao/queries';
import { TelaSobral } from './_components/TelaSobral';

export const metadata: Metadata = { title: 'Sobral AI' };

export default async function ConsultorPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [threads, parametros] = await Promise.all([listarThreads(), searchParams]);
  const projetoId = typeof parametros.projeto === 'string' ? parametros.projeto : null;
  const tarefaId = typeof parametros.tarefa === 'string' ? parametros.tarefa : null;
  const projeto = projetoId && tarefaId ? await obterProjetoExecucao(projetoId) : null;
  const tarefa = projeto?.tarefas.find((item) => item.id === tarefaId) ?? null;
  const contextoInicial = projeto && tarefa ? montarContextoSobralTarefa(projeto, tarefa) : null;

  return <TelaSobral threads={threads} conversa={null} contextoInicial={contextoInicial} />;
}
