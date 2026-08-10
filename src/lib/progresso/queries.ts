import 'server-only';

import { cache } from 'react';
import { listarFormacoes, listarSolucoes } from '@/lib/conteudo/queries';
import { handleError } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/types.generated';
import {
  contarConcluidas,
  contarEtapasFeitas,
  PROGRESSO_VAZIO,
  type EstadoProgressoConta,
} from './estado';

function normalizarRegistro(valor: Json | undefined): Record<string, string> {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return {};
  return Object.fromEntries(
    Object.entries(valor).filter(
      (entrada): entrada is [string, string] =>
        typeof entrada[1] === 'string' && Number.isFinite(Date.parse(entrada[1])),
    ),
  );
}

/** Fonte factual única do progresso. A RPC usa security invoker e preserva a RLS. */
export const obterProgressoConta = cache(async (): Promise<EstadoProgressoConta> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('progresso_conta_snapshot').maybeSingle();

  if (error) throw handleError(error, 'progresso:snapshot');
  if (!data) return PROGRESSO_VAZIO;

  return {
    aulas: normalizarRegistro(data.aulas),
    formacoes: normalizarRegistro(data.formacoes),
    etapas: normalizarRegistro(data.etapas),
    solucoes: normalizarRegistro(data.solucoes),
  };
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
