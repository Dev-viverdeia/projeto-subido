import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { cache } from 'react';
import { listarSolucoes } from '@/lib/conteudo/queries';
import { handleError } from '@/lib/errors';
import { obterMetricasProgressoConta, type MetricasProgressoConta } from '@/lib/progresso/queries';
import { createClient } from '@/lib/supabase/server';
import { ehJwtEmitidoNoFuturo, repetirAposSincronizarRelogio } from '@/lib/supabase/retry-auth';
import type { Database, Tables } from '@/lib/supabase/types.generated';
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
  /**
   * Fatos já lidos para montar a jornada. Permanecem só entre Server Components
   * e evitam que a Início consulte a mesma operação outra vez para o Sobral AI.
   */
  fatos: FatosJornadaOperacional;
};

type FatoOportunidadeJornada = Pick<
  Tables<'crm_oportunidades'>,
  'id' | 'empresa_id' | 'titulo' | 'etapa' | 'proxima_acao' | 'proxima_acao_em' | 'atualizado_em'
>;

type FatoCallJornada = Pick<
  Tables<'calls_reunioes'>,
  'id' | 'titulo' | 'tipo' | 'status' | 'agendada_para' | 'oportunidade_id'
>;

type FatoPropostaJornada = Pick<
  Tables<'propostas'>,
  'id' | 'titulo' | 'status' | 'oportunidade_id' | 'empresa_id' | 'atualizado_em'
>;

type FatoProjetoJornada = Pick<
  Tables<'projetos_execucao'>,
  'id' | 'titulo' | 'status' | 'prazo_em' | 'atualizado_em'
> & {
  projeto_tarefas: Pick<Tables<'projeto_tarefas'>, 'status'>[];
};

export type FatosJornadaOperacional = {
  oportunidades: FatoOportunidadeJornada[];
  calls: FatoCallJornada[];
  propostas: FatoPropostaJornada[];
  projetos: FatoProjetoJornada[];
  catalogo: Pick<ProjetoInicialJornada, 'slug' | 'titulo' | 'categoria'>[];
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
      listarSolucoes(),
      supabase
        .from('crm_oportunidades')
        .select('id, empresa_id, titulo, etapa, proxima_acao, proxima_acao_em, atualizado_em')
        .limit(500),
      supabase
        .from('crm_enriquecimentos')
        .select('oportunidade_id, status')
        .eq('status', 'concluido')
        .limit(500),
      supabase
        .from('calls_reunioes')
        .select('id, titulo, tipo, status, agendada_para, oportunidade_id')
        .limit(500),
      supabase
        .from('propostas')
        .select('id, titulo, status, oportunidade_id, empresa_id, atualizado_em')
        .order('atualizado_em', { ascending: false })
        .limit(500),
      supabase
        .from('projetos_execucao')
        .select('id, titulo, status, prazo_em, atualizado_em, projeto_tarefas(status)')
        .order('atualizado_em', { ascending: false })
        .limit(200),
      obterMetricasProgressoConta(),
    ]);

  const falhar = (erro: unknown, contexto: string): never => {
    // A tentativa externa precisa receber o erro cru para reconhecer o pequeno
    // desalinhamento de relógio. Falhas permanentes continuam traduzidas aqui.
    if (ehJwtEmitidoNoFuturo(erro)) throw erro;
    throw handleError(erro, contexto);
  };

  if (perfil.error) falhar(perfil.error, 'jornada:perfil');
  if (oportunidades.error) falhar(oportunidades.error, 'jornada:oportunidades');
  if (enriquecimentos.error) falhar(enriquecimentos.error, 'jornada:enriquecimentos');
  if (calls.error) falhar(calls.error, 'jornada:calls');
  if (propostas.error) falhar(propostas.error, 'jornada:propostas');
  if (execucoes.error) falhar(execucoes.error, 'jornada:execucoes');

  const catalogo: ProjetoInicialJornada[] = projetos.map((projeto) => ({
    id: projeto.id,
    slug: projeto.slug,
    titulo: projeto.titulo,
    resumo: projeto.resumo,
    categoria: projeto.categoria,
  }));
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

  return {
    perfil: perfilMontado,
    projetos: catalogo,
    plano,
    aprendizado: progresso,
    fatos: {
      oportunidades: linhasOportunidade,
      calls: linhasCalls,
      propostas: linhasProposta,
      projetos: linhasExecucao,
      catalogo: catalogo.map(({ slug, titulo, categoria }) => ({ slug, titulo, categoria })),
    },
  };
}

export const obterJornadaOperacional = cache(async (): Promise<JornadaOperacional> => {
  return repetirAposSincronizarRelogio(async () => {
    const supabase = await createClient();
    return obterJornadaOperacionalComCliente(supabase);
  });
});
