import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { CABECALHOS_CORS, respostaJson } from '../_compartilhado/http.ts';
import { responder } from './responder.ts';

/**
 * O CONSULTOR DE IA — função própria, separada do `builder`.
 *
 * Mesmo desenho de borda (CORS aqui, rota pelo último segmento, JWT verificado
 * pela plataforma antes de rodar), mas função separada por CICLO DE VIDA: o
 * Builder muda quando o documento muda; o consultor, quando a conversa muda.
 * Deploy de um não deve arriscar o outro — foi um redeploy do builder que já
 * desfez um conserto em produção uma vez.
 */
Deno.serve((req: Request): Response | Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CABECALHOS_CORS });

  if (req.method !== 'POST') {
    return respostaJson({ erro: 'Método não suportado.' }, 405);
  }

  const passo = new URL(req.url).pathname.split('/').filter(Boolean).pop();

  switch (passo) {
    case 'responder':
      return responder(req);
    default:
      return respostaJson({ erro: 'Rota desconhecida no Consultor.' }, 404);
  }
});
