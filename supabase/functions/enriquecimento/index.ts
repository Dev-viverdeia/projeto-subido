import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { CABECALHOS_CORS, clienteDoChamador, respostaJson } from '../_compartilhado/http.ts';
import { gerarEGravar } from './gerar.ts';
import { PedidoEnriquecimento } from './schema.ts';

declare const EdgeRuntime: {
  waitUntil<T>(promise: Promise<T>): Promise<T>;
};

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CABECALHOS_CORS });
  if (req.method !== 'POST') return respostaJson({ erro: 'Método não suportado.' }, 405);

  const supabase = clienteDoChamador(req);
  if (!supabase) return respostaJson({ erro: 'Faça login para enriquecer uma oportunidade.' }, 401);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return respostaJson({ erro: 'Faça login para enriquecer uma oportunidade.' }, 401);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return respostaJson({ erro: 'Pedido inválido.' }, 400);
  }

  const pedido = PedidoEnriquecimento.safeParse(json);
  if (!pedido.success) {
    return respostaJson(
      { erro: pedido.error.issues[0]?.message ?? 'Revise os dados do enriquecimento.' },
      400,
    );
  }

  const { data: id, error } = await supabase.rpc('crm_iniciar_enriquecimento', {
    p_oportunidade: pedido.data.oportunidade_id,
  });

  if (error) {
    console.error(`[enriquecimento:iniciar] ${error.code}: ${error.message}`);
    if (error.message.includes('enriquecimento_em_andamento')) {
      return respostaJson({ erro: 'Esta oportunidade já está sendo enriquecida.' }, 409);
    }
    if (error.message.includes('oportunidade_nao_encontrada')) {
      return respostaJson({ erro: 'Oportunidade não encontrada.' }, 404);
    }
    if (error.message.includes('creditos_insuficientes')) {
      return respostaJson(
        { erro: 'Você não tem créditos suficientes para este enriquecimento.' },
        402,
      );
    }
    return respostaJson({ erro: 'Não foi possível iniciar a análise.' }, 500);
  }

  const { data: execucao, error: erroExecucao } = await supabase
    .from('crm_enriquecimentos')
    .select('dominio, linkedin_url, contexto')
    .eq('id', String(id))
    .single();
  if (erroExecucao || !execucao) {
    await supabase
      .from('crm_enriquecimentos')
      .update({
        status: 'falhou',
        erro: 'Não foi possível carregar os dados da oportunidade.',
        concluido_em: new Date().toISOString(),
      })
      .eq('id', String(id));
    return respostaJson({ erro: 'Não foi possível carregar os dados da oportunidade.' }, 500);
  }

  EdgeRuntime.waitUntil(
    gerarEGravar(supabase, String(id), {
      oportunidade_id: pedido.data.oportunidade_id,
      dominio: execucao.dominio ?? undefined,
      linkedin_url: execucao.linkedin_url ?? undefined,
      contexto: execucao.contexto ?? undefined,
    }),
  );
  return respostaJson({ id, status: 'na_fila' }, 202);
});
