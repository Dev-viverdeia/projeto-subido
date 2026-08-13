import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { cache } from 'react';
import { handleError } from '@/lib/errors';
import { obterMetricasProgressoConta, type MetricasProgressoConta } from '@/lib/progresso/queries';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types.generated';
import { montarPlanoJornada, type PerfilJornada, type PlanoJornada } from './motor';

export type ProjetoInicialJornada = {
  id: string;
  slug: string;
  titulo: string;
  resumo: string;
  categoria: string | null;
};

export type JornadaOperacional = {
  perfil: PerfilJornada;
  projetos: ProjetoInicialJornada[];
  plano: PlanoJornada;
  aprendizado: MetricasProgressoConta;
};

export async function obterJornadaOperacionalComCliente(
  supabase: SupabaseClient<Database>,
): Promise<JornadaOperacional> {
  const [perfil, projetos, oportunidades, enriquecimentos, calls, propostas, execucoes, progresso] =
    await Promise.all([
      supabase
        .from('jornada_perfis')
        .select('nicho, projeto_inicial_id, posicionamento, atualizado_em')
        .maybeSingle(),
      supabase
        .from('solucoes')
        .select('id, slug, titulo, resumo, categoria')
        .eq('status', 'publicado')
        .order('ordem')
        .order('criado_em', { ascending: false })
        .limit(20),
      supabase.from('crm_oportunidades').select('id, etapa, proxima_acao').limit(500),
      supabase
        .from('crm_enriquecimentos')
        .select('oportunidade_id, status')
        .eq('status', 'concluido')
        .limit(500),
      supabase.from('calls_reunioes').select('id, tipo, status').limit(500),
      supabase
        .from('propostas')
        .select('id, status, atualizado_em')
        .order('atualizado_em', { ascending: false })
        .limit(500),
      supabase
        .from('projetos_execucao')
        .select('id, titulo, status, atualizado_em, projeto_tarefas(status)')
        .order('atualizado_em', { ascending: false })
        .limit(200),
      obterMetricasProgressoConta(),
    ]);

  if (perfil.error) throw handleError(perfil.error, 'jornada:perfil');
  if (projetos.error) throw handleError(projetos.error, 'jornada:projetos');
  if (oportunidades.error) throw handleError(oportunidades.error, 'jornada:oportunidades');
  if (enriquecimentos.error) throw handleError(enriquecimentos.error, 'jornada:enriquecimentos');
  if (calls.error) throw handleError(calls.error, 'jornada:calls');
  if (propostas.error) throw handleError(propostas.error, 'jornada:propostas');
  if (execucoes.error) throw handleError(execucoes.error, 'jornada:execucoes');

  const catalogo = projetos.data ?? [];
  const linhaPerfil = perfil.data;
  const projetoEscolhido = catalogo.find(
    (projeto) => projeto.id === linhaPerfil?.projeto_inicial_id,
  );
  const perfilMontado: PerfilJornada = linhaPerfil
    ? {
        nicho: linhaPerfil.nicho,
        projetoInicialId: linhaPerfil.projeto_inicial_id,
        projetoInicialTitulo: projetoEscolhido?.titulo ?? null,
        projetoInicialSlug: projetoEscolhido?.slug ?? null,
        posicionamento: linhaPerfil.posicionamento,
        atualizadoEm: linhaPerfil.atualizado_em,
      }
    : null;
  const linhasOportunidade = oportunidades.data ?? [];
  const linhasCalls = calls.data ?? [];
  const linhasProposta = propostas.data ?? [];
  const linhasExecucao = execucoes.data ?? [];
  const execucaoEmFoco =
    linhasExecucao.find((item) => item.status !== 'concluido' && item.status !== 'pausado') ??
    linhasExecucao[0] ??
    null;
  const tarefasEmFoco = execucaoEmFoco?.projeto_tarefas ?? [];

  const plano = montarPlanoJornada({
    perfil: perfilMontado,
    aprendizado: progresso,
    oportunidades: {
      total: linhasOportunidade.length,
      enriquecidas: new Set((enriquecimentos.data ?? []).map((item) => item.oportunidade_id)).size,
      comProximaAcao: linhasOportunidade.filter((item) => Boolean(item.proxima_acao)).length,
      ganhas: linhasOportunidade.filter((item) => item.etapa === 'ganho').length,
    },
    calls: {
      descobertasConcluidas: linhasCalls.filter(
        (item) => item.tipo === 'descoberta' && item.status === 'concluida',
      ).length,
      kickoffsConcluidos: linhasCalls.filter(
        (item) => item.tipo === 'kickoff' && item.status === 'concluida',
      ).length,
      entregasConcluidas: linhasCalls.filter(
        (item) => item.tipo === 'entrega' && item.status === 'concluida',
      ).length,
    },
    propostas: {
      total: linhasProposta.length,
      apresentadas: linhasProposta.filter(
        (item) => item.status === 'apresentada' || item.status === 'aceita',
      ).length,
      aceitas: linhasProposta.filter((item) => item.status === 'aceita').length,
    },
    entregas: {
      projetosIniciados: linhasExecucao.length,
      projetosConcluidos: linhasExecucao.filter((item) => item.status === 'concluido').length,
      propostaAceitaEmFocoId: linhasProposta.find((item) => item.status === 'aceita')?.id ?? null,
      projetoEmFocoId: execucaoEmFoco?.id ?? null,
      projetoEmFocoTitulo: execucaoEmFoco?.titulo ?? null,
      tarefasConcluidas: tarefasEmFoco.filter((item) => item.status === 'concluida').length,
      tarefasTotal: tarefasEmFoco.length,
    },
  });

  return { perfil: perfilMontado, projetos: catalogo, plano, aprendizado: progresso };
}

export const obterJornadaOperacional = cache(async (): Promise<JornadaOperacional> => {
  const supabase = await createClient();
  return obterJornadaOperacionalComCliente(supabase);
});
