import 'server-only';

import { cache } from 'react';
import { listarOportunidadesSeletor } from '@/lib/crm/queries';
import { handleError } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';
import {
  montarRotaComercialProjeto,
  type ContextoRotaComercialProjeto,
} from './rota-comercial-modelo';

export const obterRotaComercialProjeto = cache(
  async (projetoId: string): Promise<ContextoRotaComercialProjeto> => {
    const supabase = await createClient();
    const [oportunidades, propostas, execucoes] = await Promise.all([
      listarOportunidadesSeletor(),
      supabase
        .from('propostas')
        .select('id, oportunidade_id, status, atualizado_em')
        .eq('projeto_id', projetoId)
        .order('atualizado_em', { ascending: false }),
      supabase
        .from('projetos_execucao')
        .select('id, oportunidade_id, status, atualizado_em')
        .eq('projeto_id', projetoId)
        .order('atualizado_em', { ascending: false }),
    ]);

    if (propostas.error) throw handleError(propostas.error, 'projetos:rota-propostas');
    if (execucoes.error) throw handleError(execucoes.error, 'projetos:rota-execucoes');

    return montarRotaComercialProjeto(oportunidades, propostas.data ?? [], execucoes.data ?? []);
  },
);
