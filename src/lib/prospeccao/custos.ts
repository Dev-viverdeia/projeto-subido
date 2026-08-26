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
