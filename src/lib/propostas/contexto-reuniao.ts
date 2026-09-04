import 'server-only';

import { z } from 'zod';
import { obterUltimaDescobertaConcluida } from '@/lib/calls/descoberta';
import { obterPosCall } from '@/lib/calls/queries';

/** Uma reunião explícita nunca pode emprestar dados de outro cliente. */
export async function resolverReuniaoProposta(oportunidade: string, reuniao?: string) {
  if (!z.uuid().safeParse(oportunidade).success) return null;
  if (reuniao && !z.uuid().safeParse(reuniao).success) return null;

  const id = reuniao || (await obterUltimaDescobertaConcluida(oportunidade));
  if (!id) return null;

  const contexto = await obterPosCall(id);
  if (
    contexto?.oportunidade.id !== oportunidade ||
    contexto.reuniao.status !== 'concluida' ||
    !['descoberta', 'follow_up', 'proposta'].includes(contexto.reuniao.tipo)
  ) {
    return null;
  }
  return contexto;
}
