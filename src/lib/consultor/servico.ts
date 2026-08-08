import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Json } from '@/lib/supabase/types.generated';
import type { Database } from '@/lib/supabase/types.generated';
import { hashDoContexto, obterSinaisSobral } from './contexto';
import {
  detectarEtapaSobral,
  type EtapaSobral,
  type PlanoSobral,
  type SinaisSobral,
} from './direcao';
import { gerarRodadaSobral, type RodadaSobral } from './modelo';

export const TETO_TOKENS_SOBRAL_MES = 500_000;

type MensagemModelo = {
  papel: 'usuario' | 'consultor';
  conteudo: string;
};

export type LeituraSobral = {
  etapa: EtapaSobral;
  sinais: SinaisSobral;
  contextoHash: string;
  rodada: RodadaSobral;
  plano: PlanoSobral;
};

export function mesAtual(): string {
  return `${new Date().toISOString().slice(0, 7)}-01`;
}

export async function obterUsoDoMes(supabase: SupabaseClient<Database>): Promise<number> {
  const { data, error } = await supabase
    .from('consultor_uso')
    .select('tokens')
    .eq('mes', mesAtual())
    .maybeSingle();

  if (error) throw error;
  return Number(data?.tokens ?? 0);
}

export async function produzirLeituraSobral({
  supabase,
  usuarioId,
  historico,
  pedido,
}: {
  supabase: SupabaseClient<Database>;
  usuarioId: string;
  historico: MensagemModelo[];
  pedido: string;
}): Promise<LeituraSobral> {
  const sinais = await obterSinaisSobral(supabase);
  const etapa = detectarEtapaSobral(sinais);
  const rodada = await gerarRodadaSobral({ usuarioId, etapa, sinais, historico, pedido });
  const geradoEm = new Date().toISOString();

  return {
    etapa,
    sinais,
    contextoHash: hashDoContexto(sinais),
    rodada,
    plano: {
      etapa,
      diagnostico: rodada.direcao.diagnostico,
      foco: rodada.direcao.foco,
      proximoPasso: rodada.direcao.proximo_passo,
      acoes: rodada.direcao.acoes,
      sinais,
      modelo: rodada.modelo,
      geradoEm,
    },
  };
}

export function direcaoDaMensagem(leitura: LeituraSobral): Json {
  return {
    etapa: leitura.etapa,
    diagnostico: leitura.plano.diagnostico,
    foco: leitura.plano.foco,
    proximo_passo: leitura.plano.proximoPasso as unknown as Json,
    acoes: leitura.plano.acoes as unknown as Json,
    gerado_em: leitura.plano.geradoEm,
  };
}

export async function persistirPlanoSobral(
  admin: SupabaseClient<Database>,
  usuarioId: string,
  leitura: LeituraSobral,
): Promise<void> {
  const { error } = await admin.from('sobral_planos').upsert(
    {
      dono: usuarioId,
      etapa: leitura.etapa,
      diagnostico: leitura.plano.diagnostico,
      foco: leitura.plano.foco,
      proximo_passo: leitura.plano.proximoPasso as unknown as Json,
      acoes: leitura.plano.acoes as unknown as Json,
      sinais: leitura.sinais as unknown as Json,
      contexto_hash: leitura.contextoHash,
      modelo: leitura.rodada.modelo,
      gerado_em: leitura.plano.geradoEm,
    },
    { onConflict: 'dono' },
  );

  if (error) throw error;
}

export async function registrarUsoSobral(
  admin: SupabaseClient<Database>,
  usuarioId: string,
  tokens: number,
): Promise<void> {
  if (tokens <= 0) return;
  const { error } = await admin.rpc('registrar_uso_sobral', {
    p_dono: usuarioId,
    p_mes: mesAtual(),
    p_tokens: tokens,
  });
  if (error) console.error(`[sobral:uso] ${error.code}: ${error.message}`);
}
