import type { Metadata } from 'next';
import { listarThreads } from '@/lib/consultor/queries';
import { montarContextoSobralTarefa } from '@/lib/projetos-execucao/contexto-sobral';
import { obterProjetoExecucao } from '@/lib/projetos-execucao/queries';
import { createClient } from '@/lib/supabase/server';
import { TelaSobral } from './_components/TelaSobral';

export const metadata: Metadata = { title: 'Sobral AI' };

export default async function ConsultorPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const [threads, parametros, { data }] = await Promise.all([
    listarThreads(),
    searchParams,
    supabase.auth.getClaims(),
  ]);
  const projetoId = typeof parametros.projeto === 'string' ? parametros.projeto : null;
  const tarefaId = typeof parametros.tarefa === 'string' ? parametros.tarefa : null;
  const projeto = projetoId && tarefaId ? await obterProjetoExecucao(projetoId) : null;
  const tarefa = projeto?.tarefas.find((item) => item.id === tarefaId) ?? null;
  const contextoInicial = projeto && tarefa ? montarContextoSobralTarefa(projeto, tarefa) : null;
  const metadata = (data?.claims.user_metadata ?? {}) as { nome?: unknown; full_name?: unknown };
  const nomeBruto =
    typeof metadata.nome === 'string'
      ? metadata.nome
      : typeof metadata.full_name === 'string'
        ? metadata.full_name
        : '';
  const primeiroNome = nomeBruto.trim().split(/\s+/)[0] || null;

  return (
    <TelaSobral
      threads={threads}
      conversa={null}
      contextoInicial={contextoInicial}
      nome={primeiroNome}
    />
  );
}
