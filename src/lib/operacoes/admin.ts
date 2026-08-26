import 'server-only';

import { randomUUID } from 'node:crypto';
import { handleError } from '@/lib/errors';
// Fila interna: nenhum componente ou ação pública recebe a service role.
// eslint-disable-next-line no-restricted-imports
import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/lib/supabase/types.generated';
import type { OperacaoJob, TipoOperacao } from './tipos';

type NovaOperacao = {
  dono: string;
  tipo: TipoOperacao;
  chaveIdempotencia: string;
  referenciaTipo: string;
  referenciaId: string;
  payload: Json;
  prioridade?: number;
  maxTentativas?: number;
};

export async function enfileirarOperacao(entrada: NovaOperacao): Promise<OperacaoJob> {
  const admin = createAdminClient();
  const registro = {
    dono: entrada.dono,
    tipo: entrada.tipo,
    chave_idempotencia: entrada.chaveIdempotencia,
    referencia_tipo: entrada.referenciaTipo,
    referencia_id: entrada.referenciaId,
    payload: entrada.payload,
    prioridade: entrada.prioridade ?? 0,
    max_tentativas: entrada.maxTentativas ?? 3,
  };

  const { data, error } = await admin
    .from('operacoes_jobs')
    .upsert(registro, {
      onConflict: 'dono,tipo,chave_idempotencia',
      ignoreDuplicates: true,
    })
    .select('*')
    .maybeSingle();
  if (error) throw handleError(error, 'operacoes:enfileirar');
  if (data) return data;

  const existente = await admin
    .from('operacoes_jobs')
    .select('*')
    .eq('dono', entrada.dono)
    .eq('tipo', entrada.tipo)
    .eq('chave_idempotencia', entrada.chaveIdempotencia)
    .single();
  if (existente.error) throw handleError(existente.error, 'operacoes:ler-existente');
  return existente.data;
}

export async function reivindicarOperacoes({
  limite = 4,
  tipos = ['prospeccao', 'pos_call'],
  jobId,
}: {
  limite?: number;
  tipos?: TipoOperacao[];
  jobId?: string;
} = {}): Promise<OperacaoJob[]> {
  const { data, error } = await createAdminClient().rpc('operacoes_sistema_reivindicar', {
    p_limite: limite,
    p_worker: `vercel:${randomUUID()}`,
    p_tipos: tipos,
    p_job_id: jobId ?? undefined,
  });
  if (error) throw handleError(error, 'operacoes:reivindicar');
  return data ?? [];
}

export async function concluirOperacao(job: OperacaoJob, resultado: Json = {}) {
  if (!job.bloqueio_id) throw new Error('Operação reivindicada sem token de execução.');
  const { data, error } = await createAdminClient().rpc('operacoes_sistema_concluir', {
    p_job: job.id,
    p_bloqueio: job.bloqueio_id,
    p_resultado: resultado,
  });
  if (error) throw handleError(error, 'operacoes:concluir');
  return data;
}

export async function registrarFalhaOperacao(
  job: OperacaoJob,
  causa: unknown,
): Promise<OperacaoJob> {
  if (!job.bloqueio_id) throw new Error('Operação reivindicada sem token de execução.');
  const codigo = causa instanceof Error && causa.name ? causa.name : 'erro_operacional';
  const mensagem = causa instanceof Error ? causa.message : 'Não foi possível concluir a operação.';
  const { data, error } = await createAdminClient().rpc('operacoes_sistema_falhar', {
    p_job: job.id,
    p_bloqueio: job.bloqueio_id,
    p_codigo: codigo,
    p_mensagem: mensagem,
  });
  if (error) throw handleError(error, 'operacoes:falhar');
  return data;
}

export async function recuperarEnriquecimentosAbandonados(): Promise<number> {
  const { data, error } = await createAdminClient().rpc(
    'operacoes_sistema_recuperar_enriquecimentos',
  );
  if (error) throw handleError(error, 'operacoes:watchdog-enriquecimento');
  return data ?? 0;
}

export async function reagendarOperacao(jobId: string): Promise<OperacaoJob> {
  const { data, error } = await createAdminClient().rpc('operacoes_sistema_reagendar', {
    p_job: jobId,
  });
  if (error) throw handleError(error, 'operacoes:reagendar');
  return data;
}
