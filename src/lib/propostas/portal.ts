import 'server-only';

import { cache } from 'react';
import { z } from 'zod';
import { handleError } from '@/lib/errors';
// Excecao deliberada: o codigo secreto e resolvido somente no servidor. Nenhuma
// policy anonima e aberta para propostas, documentos ou eventos comerciais.
// eslint-disable-next-line no-restricted-imports
import { createAdminClient } from '@/lib/supabase/admin';
import { lerDocumentoProposta, type DocumentoProposta } from './schema';
import type { StatusProposta } from './queries';

const ResultadoDecisaoSchema = z.object({
  proposta_id: z.uuid(),
  status: z.enum(['aceita', 'recusada']),
  projeto_id: z.uuid().nullable(),
});

export type PropostaPublica = {
  id: string;
  titulo: string;
  status: Extract<StatusProposta, 'apresentada' | 'aceita' | 'recusada'>;
  versao: number;
  documento: DocumentoProposta;
  compartilhadaEm: string | null;
  decididaEm: string | null;
  decisaoNome: string | null;
  decisaoComentario: string | null;
};

export type ResultadoDecisaoProposta = z.infer<typeof ResultadoDecisaoSchema>;

function codigoValido(codigo: string): boolean {
  return z.uuid().safeParse(codigo).success;
}

export const obterPropostaPublica = cache(
  async (codigo: string): Promise<PropostaPublica | null> => {
    if (!codigoValido(codigo)) return null;

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('propostas')
      .select(
        'id, titulo, status, versao, documento, compartilhada_em, decidida_em, decisao_nome, decisao_comentario',
      )
      .eq('compartilhamento_codigo', codigo)
      .eq('compartilhamento_ativo', true)
      .in('status', ['apresentada', 'aceita', 'recusada'])
      .maybeSingle();

    if (error) throw handleError(error, 'proposta-portal:obter');
    if (!data || !['apresentada', 'aceita', 'recusada'].includes(data.status)) return null;

    const documento = lerDocumentoProposta(data.documento);
    if (!documento) return null;

    return {
      id: data.id,
      titulo: data.titulo,
      status: data.status as PropostaPublica['status'],
      versao: data.versao,
      documento,
      compartilhadaEm: data.compartilhada_em,
      decididaEm: data.decidida_em,
      decisaoNome: data.decisao_nome,
      decisaoComentario: data.decisao_comentario,
    };
  },
);

export async function registrarVisualizacaoProposta(codigo: string): Promise<boolean> {
  if (!codigoValido(codigo)) return false;

  const admin = createAdminClient();
  const { data, error } = await admin.rpc('proposta_portal_visualizar', {
    p_codigo: codigo,
  });

  if (error) throw handleError(error, 'proposta-portal:visualizar');
  return data;
}

export async function registrarDecisaoProposta({
  codigo,
  decisao,
  nome,
  email,
  comentario,
}: {
  codigo: string;
  decisao: 'aceita' | 'recusada';
  nome: string;
  email: string;
  comentario: string | null;
}): Promise<ResultadoDecisaoProposta | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('proposta_portal_decidir', {
    p_codigo: codigo,
    p_decisao: decisao,
    p_nome: nome,
    p_email: email,
    p_comentario: comentario ?? undefined,
  });

  if (error) throw handleError(error, 'proposta-portal:decidir');
  if (data === null) return null;

  const resultado = ResultadoDecisaoSchema.safeParse(data);
  if (!resultado.success) throw new Error('Resposta invalida ao registrar a decisao da proposta.');
  return resultado.data;
}
