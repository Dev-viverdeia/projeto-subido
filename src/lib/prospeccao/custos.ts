import 'server-only';

// eslint-disable-next-line no-restricted-imports -- ledger privado gravado apenas pelo sistema
import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/lib/supabase/types.generated';

export type ProvedorProspeccao = 'apify' | 'firecrawl' | 'perplexity' | 'serpapi' | 'openai';

export type UsoProvedorProspeccao = {
  provedor: ProvedorProspeccao;
  operacao: string;
  status: 'concluido' | 'parcial' | 'falhou';
  unidades: number;
  unidade: 'execucao' | 'requisicao' | 'pagina' | 'token';
  creditosProvedor?: number;
  custoUsdMicros?: number;
  latenciaMs?: number;
  cacheHit?: boolean;
  metadados?: Record<string, Json | undefined>;
};

export const PERPLEXITY_SEARCH_USD_MICROS_POR_REQUISICAO = 5_000;
export const SERPAPI_SEARCH_USD_MICROS_POR_REQUISICAO = 10_000;
export const OPENAI_RATE_CARD_VERSAO = '2026-08-25';

export function custoOpenAIUsdMicros({
  modelo,
  inputTokens,
  cachedInputTokens,
  outputTokens,
}: {
  modelo: string;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
}) {
  // Rate card público da API em 25/08/2026. Em USD por 1M tokens:
  // Luna = 0,20 input, 0,02 cached input e 1,20 output.
  // Em USD micros, multiplicar tokens pela tarifa por milhão mantém a unidade.
  if (!modelo.startsWith('gpt-5.6-luna')) return undefined;
  const cached = Math.min(Math.max(0, cachedInputTokens), Math.max(0, inputTokens));
  const inputSemCache = Math.max(0, inputTokens - cached);
  return Math.round(inputSemCache * 0.2 + cached * 0.02 + Math.max(0, outputTokens) * 1.2);
}

export async function registrarCustosProspeccao({
  dono,
  lista,
  usos,
}: {
  dono: string;
  lista: string;
  usos: UsoProvedorProspeccao[];
}) {
  if (!usos.length) return;

  const { error } = await createAdminClient()
    .from('prospeccao_custos_provedores')
    .insert(
      usos.map((uso) => ({
        dono,
        lista_id: lista,
        provedor: uso.provedor,
        operacao: uso.operacao,
        status: uso.status,
        unidades: uso.unidades,
        unidade: uso.unidade,
        creditos_provedor: uso.creditosProvedor ?? 0,
        custo_usd_micros: Math.max(0, Math.round(uso.custoUsdMicros ?? 0)),
        latencia_ms: uso.latenciaMs ?? null,
        cache_hit: uso.cacheHit ?? false,
        metadados: uso.metadados ?? {},
      })),
    );

  if (error) {
    // A telemetria nunca pode transformar uma lista válida em falha para o usuário.
    console.error(`[prospeccao:custos] ${error.code}: ${error.message}`);
  }
}
