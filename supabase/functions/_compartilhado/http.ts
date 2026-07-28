import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.110.9';
import { ErroDoBuilder } from './modelo.ts';

/**
 * As peças de borda que as duas funções compartilham: CORS, cliente do chamador e
 * tradução de erro em status.
 */

/**
 * CORS.
 *
 * `supabase.functions.invoke` do browser dispara um preflight `OPTIONS` sempre
 * que há header `Authorization` — e há, porque a função exige JWT. Sem responder
 * ao preflight, a chamada morre no navegador antes de a função rodar, e o erro
 * que chega ao usuário não menciona CORS em lugar nenhum.
 *
 * `*` é aceitável aqui e só aqui: a autorização de verdade é o JWT que o
 * `verify_jwt` valida antes de a função executar, mais a RLS depois. Origem não
 * autentica ninguém.
 */
export const CABECALHOS_CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function respostaJson(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CABECALHOS_CORS, 'Content-Type': 'application/json' },
  });
}

const STATUS: Record<ErroDoBuilder['tipo'], number> = {
  'sem-chave': 503,
  limite: 429,
  recusa: 400,
  falha: 500,
};

/**
 * Erro → resposta HTTP. O código importa porque o cliente reage a ele: 503 é
 * pendência de configuração e não adianta repetir; 429 pede espera; 400 pede
 * reescrever a ideia. Um 500 para tudo transformaria três situações diferentes na
 * mesma frase inútil.
 */
export function respostaDeErro(erro: unknown): Response {
  if (erro instanceof ErroDoBuilder) {
    return respostaJson({ erro: erro.message, tipo: erro.tipo }, STATUS[erro.tipo]);
  }
  console.error('[builder] erro não tratado:', erro);
  return respostaJson(
    { erro: 'Não foi possível completar a ação. Tente de novo em instantes.', tipo: 'falha' },
    500,
  );
}

/**
 * Cliente do CHAMADOR, não do serviço.
 *
 * A função repassa o `Authorization` recebido, então toda consulta continua
 * passando pela RLS com a identidade de quem chamou. É por isso que não há
 * `SUPABASE_SERVICE_ROLE_KEY` em lugar nenhum destas funções: com service role, o
 * `dono` viraria um campo que o código precisa lembrar de conferir, e a policy
 * `dono = auth.uid()` deixaria de ser a barreira. Aqui ela continua sendo.
 *
 * O JWT continua válido durante a TAREFA DE FUNDO: ele vale ~1h, e a geração leva
 * minutos. Não é preciso escalar privilégio para gravar o resultado depois.
 */
export function clienteDoChamador(req: Request): SupabaseClient | null {
  const authorization = req.headers.get('Authorization');
  if (!authorization) return null;

  const url = Deno.env.get('SUPABASE_URL');
  const chave = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY');
  if (!url || !chave) return null;

  return createClient(url, chave, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
