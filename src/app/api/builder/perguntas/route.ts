import { createClient } from '@/lib/supabase/server';
import { handleError } from '@/lib/errors';
import { gerarPerguntas } from '@/lib/builder/gerar';
import { respostaDeErro } from '@/lib/builder/http';
import { PedidoPerguntas } from '@/lib/builder/schema';

/**
 * PASSO 1 DO BUILDER — a entrevista.
 *
 * Recebe a ideia, devolve as perguntas que faltam e GRAVA o rascunho. Gravar
 * aqui, antes de qualquer resposta, é o que dá ao implementador um rascunho para
 * retomar se ele fechar a aba no meio da entrevista — o motivo de a solução ser
 * persistida desde o começo em vez de só no fim.
 *
 * POR QUE ROTA E NÃO SERVER ACTION
 * Server Action herda o `maxDuration` da PÁGINA que a chama. A geração do passo 2
 * leva dezenas de segundos e precisa de um teto próprio; ter os dois passos na
 * mesma superfície mantém o fluxo num lugar só, em vez de metade em action e
 * metade em rota.
 */
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    /* `getUser()` e não `getSession()`: session lê o cookie sem validar a
       assinatura no servidor de auth — um cookie forjado passaria. */
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ erro: 'Faça login para usar o Builder.' }, { status: 401 });
    }

    const corpo = PedidoPerguntas.safeParse(await request.json());
    if (!corpo.success) {
      return Response.json(
        { erro: corpo.error.issues[0]?.message ?? 'Ideia inválida.', tipo: 'recusa' },
        { status: 400 },
      );
    }

    const { ideia } = corpo.data;

    /* A chamada ao modelo vem ANTES do insert: sem chave configurada, ou com a
       ideia recusada, não sobra rascunho vazio no histórico. */
    const { perguntas } = await gerarPerguntas(ideia);

    const { data, error } = await supabase
      .from('builder_solucoes')
      .insert({
        dono: user.id,
        ideia_original: ideia,
        /* As perguntas nascem com resposta vazia. Guardar a pergunta junto da
           resposta é o que mantém o registro legível quando o roteiro mudar. */
        respostas: perguntas.map((p) => ({ ...p, resposta: '' })),
      })
      .select('id')
      .single();

    if (error) throw handleError(error, 'builder:criar');

    return Response.json({ id: data.id, perguntas });
  } catch (erro) {
    return respostaDeErro(erro);
  }
}
