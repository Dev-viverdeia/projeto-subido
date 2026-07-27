import type { PostgrestError } from '@supabase/supabase-js';

/**
 * Tradução de erro de banco para mensagem de usuário.
 *
 * POR QUE NÃO MOSTRAR `error.message` DIRETO
 * O PostgREST devolve o texto do Postgres. `new row violates row-level security
 * policy for table "certificados"` entrega ao visitante o nome da tabela, a
 * existência da policy e o fato de que ele foi barrado por autorização e não por
 * validação — três informações que só ajudam quem está sondando. E para o usuário
 * legítimo a frase não significa nada.
 *
 * Este módulo é a única fronteira onde o erro cru vira texto exibível. O cru vai
 * para o log do servidor, com contexto; o usuário recebe uma frase que descreve o
 * que aconteceu do ponto de vista DELE.
 */

/** Erro já traduzido — seguro para renderizar. */
export class ErroVisivel extends Error {
  constructor(
    message: string,
    readonly causa?: unknown,
  ) {
    super(message);
    this.name = 'ErroVisivel';
  }
}

const MENSAGEM_PADRAO = 'Não foi possível completar a ação. Tente de novo em instantes.';

/**
 * Códigos que merecem uma frase própria.
 *
 * A lista é curta de propósito: cada entrada é um caso em que o usuário PODE fazer
 * algo a respeito. Erro que ele não consegue resolver não ganha texto específico —
 * ganha a mensagem padrão, porque detalhe extra ali é ruído para ele e pista para
 * quem sonda.
 */
const POR_CODIGO: Record<string, string> = {
  /* unique_violation */
  '23505': 'Esse registro já existe.',
  /* foreign_key_violation */
  '23503': 'Esse item depende de outro que não existe mais. Recarregue a página.',
  /* check_violation */
  '23514': 'Algum campo está fora do formato esperado.',
  /* insufficient_privilege — RLS reprovou. Deliberadamente vago. */
  '42501': 'Você não tem acesso a este conteúdo.',
  /* PostgREST: filtro não retornou nenhuma linha em .single() */
  PGRST116: 'Não encontramos o que você procurava.',
};

function ehPostgrestError(valor: unknown): valor is PostgrestError {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    'message' in valor &&
    'code' in valor &&
    typeof (valor as { code: unknown }).code === 'string'
  );
}

/**
 * Registra o erro cru e devolve um `ErroVisivel`.
 *
 * Devolve em vez de lançar para que quem chama decida entre `throw` (deixa o
 * error boundary pegar) e retornar como estado de formulário. `contexto` é o que
 * torna o log útil: `'criar-conta'`, `'solucoes:listar'` — sem ele, o log vira uma
 * pilha de mensagens do Postgres sem origem.
 */
export function handleError(erro: unknown, contexto: string): ErroVisivel {
  if (ehPostgrestError(erro)) {
    console.error(`[${contexto}] postgrest ${erro.code}: ${erro.message}`, {
      details: erro.details,
      hint: erro.hint,
    });
    return new ErroVisivel(POR_CODIGO[erro.code] ?? MENSAGEM_PADRAO, erro);
  }

  console.error(`[${contexto}]`, erro);
  return new ErroVisivel(MENSAGEM_PADRAO, erro);
}
