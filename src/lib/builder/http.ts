import 'server-only';

import { ErroDoBuilder } from './gerar';

/**
 * Erro do Builder → resposta HTTP.
 *
 * O código importa porque o cliente reage a ele: 503 (sem chave) é uma pendência
 * de configuração e não adianta tentar de novo; 429 pede espera; 400 pede reescrever
 * a ideia. Devolver 500 para tudo transformaria três situações diferentes na mesma
 * frase inútil.
 *
 * O `message` já vem traduzido de `gerar.ts` — nada de stack ou texto de API cru
 * atravessa esta fronteira, pela mesma razão que `handleError` existe para o banco.
 */
const STATUS: Record<ErroDoBuilder['tipo'], number> = {
  'sem-chave': 503,
  limite: 429,
  recusa: 400,
  falha: 500,
};

export function respostaDeErro(erro: unknown): Response {
  if (erro instanceof ErroDoBuilder) {
    return Response.json({ erro: erro.message, tipo: erro.tipo }, { status: STATUS[erro.tipo] });
  }

  console.error('[builder:rota]', erro);
  return Response.json(
    { erro: 'Não foi possível completar a ação. Tente de novo em instantes.', tipo: 'falha' },
    { status: 500 },
  );
}
