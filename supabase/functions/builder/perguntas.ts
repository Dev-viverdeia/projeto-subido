import { clienteDoChamador, respostaDeErro, respostaJson } from '../_compartilhado/http.ts';
import { gerarPerguntas } from '../_compartilhado/modelo.ts';
import { PedidoPerguntas } from '../_compartilhado/schema.ts';

/**
 * PASSO 1 DO BUILDER — a entrevista.
 *
 * Recebe a ideia, devolve as perguntas que faltam e GRAVA o rascunho. Gravar aqui,
 * antes de qualquer resposta, é o que dá ao implementador um rascunho para retomar
 * se ele fechar a aba no meio da entrevista.
 *
 * SÍNCRONA, ao contrário da geração. A chamada é curta (max_tokens 4000, sem
 * pensamento longo) e cabe folgada no idle timeout de 150s da plataforma. Empurrá-la
 * para segundo plano criaria um quinto estado no banco só para exibir "pensando nas
 * perguntas" — complexidade sem ganho.
 */
export async function perguntas(req: Request): Promise<Response> {
  try {
    const supabase = clienteDoChamador(req);
    if (!supabase) return respostaJson({ erro: 'Faça login para usar o Builder.' }, 401);

    /* `getUser()` e não `getSession()`: session lê o token sem validar a assinatura
       no servidor de auth. O `verify_jwt` da plataforma já barrou o grosso, mas o
       `id` que vai para a coluna `dono` precisa vir de uma fonte verificada. */
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return respostaJson({ erro: 'Faça login para usar o Builder.' }, 401);

    const corpo = PedidoPerguntas.safeParse(await req.json());
    if (!corpo.success) {
      return respostaJson(
        { erro: corpo.error.issues[0]?.message ?? 'Ideia inválida.', tipo: 'recusa' },
        400,
      );
    }

    const { ideia, oportunidade, projetoBase } = corpo.data;

    /* O browser escolhe somente IDs. A função relê os dois vínculos com o JWT
       do chamador antes de gravar; a RLS decide se pertencem ao contexto que a
       pessoa realmente pode usar. */
    const [oportunidadeValida, projetoValido] = await Promise.all([
      oportunidade
        ? supabase.from('crm_oportunidades').select('id').eq('id', oportunidade).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      projetoBase
        ? supabase
            .from('solucoes')
            .select('id')
            .eq('id', projetoBase)
            .eq('status', 'publicado')
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (oportunidadeValida.error || (oportunidade && !oportunidadeValida.data)) {
      return respostaJson({ erro: 'A oportunidade selecionada não está disponível.' }, 403);
    }
    if (projetoValido.error || (projetoBase && !projetoValido.data)) {
      return respostaJson({ erro: 'O Projeto-base selecionado não está disponível.' }, 403);
    }

    /* A chamada ao modelo vem ANTES do insert: sem chave configurada, ou com a
       ideia recusada, não sobra rascunho vazio no histórico. */
    const { perguntas } = await gerarPerguntas(ideia);

    const { data, error } = await supabase
      .from('builder_solucoes')
      .insert({
        dono: user.id,
        ideia_original: ideia,
        oportunidade_id: oportunidade ?? null,
        projeto_base_id: projetoBase ?? null,
        /* As perguntas nascem com resposta vazia. Guardar a pergunta junto da
           resposta é o que mantém o registro legível quando o roteiro mudar. */
        respostas: perguntas.map((p) => ({ ...p, resposta: '' })),
      })
      .select('id')
      .single();

    if (error) {
      console.error('[builder:perguntas] insert:', error);
      return respostaJson({ erro: 'Não foi possível salvar o rascunho.', tipo: 'falha' }, 500);
    }

    return respostaJson({ id: data.id, perguntas });
  } catch (erro) {
    return respostaDeErro(erro);
  }
}
