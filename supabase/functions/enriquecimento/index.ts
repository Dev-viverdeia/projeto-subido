import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { CABECALHOS_CORS, clienteDoChamador, respostaJson } from '../_compartilhado/http.ts';
import { gerarEGravar } from './gerar.ts';
import { PedidoEnriquecimento } from './schema.ts';
import { normalizarSite } from './site.ts';

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

  const site = normalizarSite(pedido.data.dominio);
  if (pedido.data.dominio && !site) {
    return respostaJson({ erro: 'Digite um site válido, como empresa.com.br.' }, 400);
  }

  if (pedido.data.linkedin_url) {
    try {
      const linkedin = new URL(pedido.data.linkedin_url);
      const host = linkedin.hostname.toLowerCase();
      if (
        linkedin.protocol !== 'https:' ||
        !(host === 'linkedin.com' || host.endsWith('.linkedin.com'))
      ) {
        throw new Error('linkedin_invalido');
      }
    } catch {
      return respostaJson({ erro: 'Digite uma URL válida do LinkedIn.' }, 400);
    }
  }

  const entrada = {
    ...pedido.data,
    dominio: site?.hostname,
  };

  const { data: id, error } = await supabase.rpc('crm_iniciar_enriquecimento', {
    p_oportunidade: entrada.oportunidade_id,
    p_dominio: entrada.dominio,
    p_linkedin_url: entrada.linkedin_url,
    p_contexto: entrada.contexto,
  });

  if (error) {
    console.error(`[enriquecimento:iniciar] ${error.code}: ${error.message}`);
    if (error.message.includes('enriquecimento_em_andamento')) {
      return respostaJson({ erro: 'Esta oportunidade já está sendo enriquecida.' }, 409);
    }
    if (error.message.includes('oportunidade_nao_encontrada')) {
      return respostaJson({ erro: 'Oportunidade não encontrada.' }, 404);
    }
    return respostaJson({ erro: 'Não foi possível iniciar a análise.' }, 500);
  }

  EdgeRuntime.waitUntil(gerarEGravar(supabase, String(id), entrada));
  return respostaJson({ id, status: 'na_fila' }, 202);
});
