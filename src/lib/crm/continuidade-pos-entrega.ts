import 'server-only';

import { handleError } from '@/lib/errors';
import { obterEncerramentoUnico } from '@/lib/projetos-execucao/encerramento';
import { obterEvolucaoUnica } from '@/lib/projetos-execucao/evolucao';
import { createClient } from '@/lib/supabase/server';
import type { ContinuidadePosEntregaDossie } from './dossie-types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function obterContinuidadePosEntrega(
  oportunidadeId: string,
): Promise<ContinuidadePosEntregaDossie | null> {
  const supabase = await createClient();
  const { data: evento, error: erroEvento } = await supabase
    .from('crm_eventos')
    .select('fonte_id')
    .eq('oportunidade_id', oportunidadeId)
    .eq('tipo', 'continuidade_pos_entrega')
    .order('ocorrido_em', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (erroEvento) throw handleError(erroEvento, 'crm:dossie-continuidade-evento');
  if (!evento?.fonte_id || !UUID.test(evento.fonte_id)) return null;

  const { data: projeto, error: erroProjeto } = await supabase
    .from('projetos_execucao')
    .select('id, titulo, status, projeto_encerramentos(*), projeto_evolucoes(*)')
    .eq('id', evento.fonte_id)
    .maybeSingle();

  if (erroProjeto) throw handleError(erroProjeto, 'crm:dossie-continuidade-projeto');
  const evolucao = obterEvolucaoUnica(projeto?.projeto_evolucoes);
  const encerramento = obterEncerramentoUnico(projeto?.projeto_encerramentos);
  if (
    projeto?.status !== 'concluido' ||
    evolucao?.status !== 'registrada' ||
    !evolucao.resultadoObservado ||
    !evolucao.proximoPasso ||
    !evolucao.registradaEm ||
    (evolucao.decisao !== 'expandir' && evolucao.decisao !== 'novo_projeto') ||
    encerramento?.status !== 'encerrado'
  ) {
    return null;
  }

  return {
    projetoId: projeto.id,
    projetoTitulo: projeto.titulo,
    resumoEntrega: encerramento.resumoEntrega,
    resultadoPrincipal: encerramento.resultadoPrincipal,
    resultadoObservado: evolucao.resultadoObservado,
    evidenciaResultadoUrl: evolucao.evidenciaResultadoUrl ?? encerramento.evidenciaResultadoUrl,
    decisao: evolucao.decisao,
    proximoPasso: evolucao.proximoPasso,
    proximoPassoEm: evolucao.proximoPassoEm,
    aceitaEm: encerramento.aceitoEm,
    registradaEm: evolucao.registradaEm,
  };
}
