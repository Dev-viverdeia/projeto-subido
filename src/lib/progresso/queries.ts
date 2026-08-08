import 'server-only';

import { cache } from 'react';
import { listarFormacoes, listarSolucoes } from '@/lib/conteudo/queries';
import { handleError } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';
import {
  contarConcluidas,
  contarEtapasFeitas,
  PROGRESSO_VAZIO,
  type EstadoProgressoConta,
} from './estado';

/** Fonte factual única do progresso. A RLS já limita todas as linhas ao dono. */
export const obterProgressoConta = cache(async (): Promise<EstadoProgressoConta> => {
  const supabase = await createClient();
  const [aulas, formacoes, etapas, projetos] = await Promise.all([
    supabase.from('progresso_aulas').select('aula_id, concluida_em'),
    supabase.from('progresso_formacoes').select('ultimo_acesso_em, formacoes!inner(slug)'),
    supabase.from('progresso_etapas').select('etapa_chave, concluida_em'),
    supabase.from('progresso_projetos').select('ultimo_acesso_em, solucoes!inner(slug)'),
  ]);

  if (aulas.error) throw handleError(aulas.error, 'progresso:aulas');
  if (formacoes.error) throw handleError(formacoes.error, 'progresso:formacoes');
  if (etapas.error) throw handleError(etapas.error, 'progresso:etapas');
  if (projetos.error) throw handleError(projetos.error, 'progresso:projetos');

  const estado: EstadoProgressoConta = {
    aulas: { ...PROGRESSO_VAZIO.aulas },
    formacoes: { ...PROGRESSO_VAZIO.formacoes },
    etapas: { ...PROGRESSO_VAZIO.etapas },
    solucoes: { ...PROGRESSO_VAZIO.solucoes },
  };

  for (const item of aulas.data ?? []) estado.aulas[item.aula_id] = item.concluida_em;
  for (const item of formacoes.data ?? []) {
    estado.formacoes[item.formacoes.slug] = item.ultimo_acesso_em;
  }
  for (const item of etapas.data ?? []) estado.etapas[item.etapa_chave] = item.concluida_em;
  for (const item of projetos.data ?? []) {
    estado.solucoes[item.solucoes.slug] = item.ultimo_acesso_em;
  }

  return estado;
});

export type MetricasProgressoConta = {
  aulasConcluidas: number;
  formacoesConcluidas: number;
  etapasConcluidas: number;
  projetosConcluidos: number;
};

/** Métricas sem porcentagem inventada: conclusão exige todos os itens publicados. */
export const obterMetricasProgressoConta = cache(async (): Promise<MetricasProgressoConta> => {
  const [estado, formacoes, projetos] = await Promise.all([
    obterProgressoConta(),
    listarFormacoes(),
    listarSolucoes(),
  ]);

  return {
    aulasConcluidas: Object.keys(estado.aulas).length,
    formacoesConcluidas: formacoes.filter(
      (item) =>
        item.aulaIds.length > 0 && contarConcluidas(estado, item.aulaIds) >= item.aulaIds.length,
    ).length,
    etapasConcluidas: Object.keys(estado.etapas).length,
    projetosConcluidos: projetos.filter(
      (item) =>
        item.etapaIds.length > 0 &&
        contarEtapasFeitas(estado, item.etapaIds) >= item.etapaIds.length,
    ).length,
  };
});
