import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { CABECALHOS_CORS, respostaJson } from '../_compartilhado/http.ts';
import { gerar } from './gerar.ts';
import { perguntas } from './perguntas.ts';

/**
 * UMA função para os dois passos do Builder, com rota interna.
 *
 * POR QUE NÃO DUAS FUNÇÕES
 * Elas compartilham tudo — CORS, cliente do chamador, tradução de erro, o schema
 * e o cliente da Anthropic. Duas funções seriam dois bundles com o mesmo peso de
 * dependência, dois cold starts para aquecer e dois lugares para a borda divergir.
 * A própria doc do Supabase recomenda menos funções e maiores pelo mesmo motivo.
 *
 * O CORS FICA AQUI, e só aqui. O preflight `OPTIONS` que o browser dispara por
 * causa do header `Authorization` não pertence a nenhum dos dois passos: é da
 * borda. Respondido antes do roteamento, ele nunca esbarra na lógica.
 *
 * A ROTA É O ÚLTIMO SEGMENTO do caminho — `/builder/perguntas`, `/builder/gerar`.
 * `functions.invoke('builder/perguntas')` do supabase-js monta exatamente isso.
 */
Deno.serve((req: Request): Response | Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CABECALHOS_CORS });

  if (req.method !== 'POST') {
    return respostaJson({ erro: 'Método não suportado.' }, 405);
  }

  const passo = new URL(req.url).pathname.split('/').filter(Boolean).pop();

  switch (passo) {
    case 'perguntas':
      return perguntas(req);
    case 'gerar':
      return gerar(req);
    default:
      return respostaJson({ erro: 'Rota desconhecida no Builder.' }, 404);
  }
});
