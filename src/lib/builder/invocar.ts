'use client';

import { createClient } from '@/lib/supabase/client';

/**
 * Chamada às Edge Functions do Builder, do browser.
 *
 * `'use client'` NÃO É DECORAÇÃO AQUI. Este módulo importa o cliente Supabase de
 * browser, que já carrega a diretiva. Sem declará-la também, um Server Component
 * que importasse este arquivo por engano quebraria em RUNTIME — e passaria por
 * tsc, eslint e build, porque rota dinâmica não é pré-renderizada. O
 * `check:fronteira` reprova essa combinação, e foi ele que pegou.
 *
 * POR QUE `functions.invoke` E NÃO `fetch`
 * Ele monta a URL a partir da mesma env do cliente Supabase e anexa o
 * `Authorization` da sessão vigente. Um `fetch` manual precisaria repetir as duas
 * coisas — e a segunda em especial: sem o header, a função é barrada pelo
 * `verify_jwt` antes de rodar, com um 401 que não diz o que faltou.
 *
 * POR QUE O ERRO É LIDO DA `Response` E NÃO DO `error`
 * Em resposta 4xx/5xx o supabase-js devolve um `FunctionsHttpError` cuja
 * `message` é genérica ("Edge Function returned a non-2xx status code"). A frase
 * que o implementador precisa ler está no CORPO que a função montou. Sem ir
 * buscá-la, todo erro do Builder — sem chave, limite de uso, ideia recusada —
 * viraria a mesma frase em inglês sobre status HTTP.
 *
 * `FunctionsResponseFailure.error` é declarado como `any` no supabase-js, então
 * desestruturá-lo espalharia `any` por este módulo. A `Response` original vem no
 * mesmo objeto, tipada — é dela que se lê.
 */

export type FalhaDoBuilder = {
  mensagem: string;
  /** 'sem-chave' | 'limite' | 'recusa' | 'falha' — o cliente não ramifica, mas o log sim. */
  tipo?: string;
};

async function invocar<T>(
  funcao: string,
  corpo: Record<string, unknown>,
): Promise<{ dados: T; falha: null } | { dados: null; falha: FalhaDoBuilder }> {
  const supabase = createClient();

  /* Sem desestruturar: `error` é `any` na tipagem do supabase-js e a
     desestruturação o espalharia. Ler a propriedade num teste de verdade não
     atribui nada. */
  const resposta = await supabase.functions.invoke<T>(funcao, { body: corpo });

  if (resposta.error) {
    const doCorpo = await mensagemDoCorpo(resposta.response);
    return {
      dados: null,
      falha: doCorpo ?? { mensagem: 'Não foi possível completar a ação. Tente de novo.' },
    };
  }

  /* O union do supabase-js NÃO discrimina: o ramo de falha declara `error: any`,
     e `any` não estreita nada — mesmo depois do teste acima o compilador ainda vê
     `data: T | null`. A asserção afirma o que o teste já garantiu. */
  return { dados: resposta.data as T, falha: null };
}

async function mensagemDoCorpo(response: Response | undefined): Promise<FalhaDoBuilder | null> {
  if (!response) return null;

  try {
    const corpo: unknown = await response.json();
    if (typeof corpo === 'object' && corpo !== null && 'erro' in corpo) {
      return {
        mensagem: String(corpo.erro),
        tipo: 'tipo' in corpo ? String(corpo.tipo) : undefined,
      };
    }
  } catch {
    /* Corpo não-JSON — um 504 da plataforma, por exemplo. Cai no genérico. */
  }
  return null;
}

export type RespostaPerguntas = {
  id: string;
  perguntas: { pergunta: string; porque: string }[];
};

export function pedirPerguntas(ideia: string) {
  return invocar<RespostaPerguntas>('builder/perguntas', { ideia });
}

export function pedirGeracao(id: string, respostas: unknown) {
  return invocar<{ id: string }>('builder/gerar', { id, respostas });
}
