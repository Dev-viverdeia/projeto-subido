import 'server-only';

import { z } from 'zod';
import { handleError } from '@/lib/errors';
// Worker interno: a autorização do usuário acontece antes do agendamento e o
// webhook do LiveKit é validado criptograficamente.
// eslint-disable-next-line no-restricted-imports
import { createAdminClient } from '@/lib/supabase/admin';
import { SegmentoLiveSchema, type SegmentoLive } from './coach-schema';

const SegmentosSalvosSchema = z.array(SegmentoLiveSchema);

export async function obterSegmentosPersistidos(reuniaoId: string): Promise<SegmentoLive[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('calls_transcricoes')
    .select('segmentos')
    .eq('reuniao_id', reuniaoId)
    .maybeSingle();
  if (error) throw handleError(error, 'calls:transcricao:processar');
  const leitura = SegmentosSalvosSchema.safeParse(data?.segmentos ?? []);
  return leitura.success ? leitura.data : [];
}

/** Reserva a análise para um único worker (browser ou webhook). */
export async function reivindicarAnalise({ dono, reuniaoId }: { dono: string; reuniaoId: string }) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('calls_reivindicar_analise', {
    p_dono: dono,
    p_reuniao: reuniaoId,
  });
  if (error) throw handleError(error, 'calls:analise:reivindicar');
  return data;
}
