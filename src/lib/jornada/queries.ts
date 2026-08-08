import 'server-only';

import { cache } from 'react';
import { handleError } from '@/lib/errors';
import { obterMetricasProgressoConta } from '@/lib/progresso/queries';
import { createClient } from '@/lib/supabase/server';
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
};

export const obterJornadaOperacional = cache(async (): Promise<JornadaOperacional> => {
  const supabase = await createClient();
  const [perfil, projetos, oportunidades, calls, diagnosticos, propostas, progresso] =
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
      supabase.from('calls_reunioes').select('id, tipo, status').limit(500),
      supabase.from('diagnosticos_atendimento').select('id, status').limit(500),
      supabase.from('propostas').select('id, status').limit(500),
      obterMetricasProgressoConta(),
    ]);

  if (perfil.error) throw handleError(perfil.error, 'jornada:perfil');
  if (projetos.error) throw handleError(projetos.error, 'jornada:projetos');
  if (oportunidades.error) throw handleError(oportunidades.error, 'jornada:oportunidades');
  if (calls.error) throw handleError(calls.error, 'jornada:calls');
  if (diagnosticos.error) throw handleError(diagnosticos.error, 'jornada:diagnosticos');
  if (propostas.error) throw handleError(propostas.error, 'jornada:propostas');

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
  const linhasDiagnostico = diagnosticos.data ?? [];
  const linhasProposta = propostas.data ?? [];

  const plano = montarPlanoJornada({
    perfil: perfilMontado,
    aprendizado: progresso,
    oportunidades: {
      total: linhasOportunidade.length,
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
    diagnosticosConcluidos: linhasDiagnostico.filter((item) => item.status === 'concluido').length,
    propostas: {
      total: linhasProposta.length,
      apresentadas: linhasProposta.filter(
        (item) => item.status === 'apresentada' || item.status === 'aceita',
      ).length,
      aceitas: linhasProposta.filter((item) => item.status === 'aceita').length,
    },
  });

  return { perfil: perfilMontado, projetos: catalogo, plano };
});
