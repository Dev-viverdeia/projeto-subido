import Anthropic from 'npm:@anthropic-ai/sdk@0.115.0';
import { z } from 'npm:zod@4.4.3';
import { clienteDoChamador, respostaDeErro, respostaJson } from '../_compartilhado/http.ts';
import { ErroDoBuilder, traduzir } from '../_compartilhado/modelo.ts';

/**
 * UMA RODADA do Consultor: recebe a mensagem, devolve a resposta, grava as duas.
 *
 * SÍNCRONA, ao contrário da geração do Builder: uma resposta de chat leva
 * segundos, não minutos — cabe folgada no idle timeout de 150s da plataforma, e
 * chat com resposta por polling seria pior que a espera.
 *
 * `claude-sonnet-5` e não opus: o Builder produz o documento que vai para o
 * cliente e é o lugar de pagar raciocínio; o consultor é conversa de orientação,
 * onde latência baixa vale mais que o último degrau de qualidade.
 *
 * O CATÁLOGO ENTRA NO SYSTEM. As soluções publicadas (título, slug, resumo,
 * categoria e ferramentas) são lidas do banco A CADA rodada, pelo cliente do
 * CHAMADOR — RLS intacta. É o que faz o consultor recomendar o que existe de
 * verdade na plataforma em vez de inventar produto.
 */

const MODELO_CHAT = 'claude-sonnet-5';

/* TETO MENSAL por pessoa, em tokens (entrada + saída), como a plataforma de
   origem. 500k ≈ 250 rodadas de ~2k tokens — premissa: rodada típica desta
   função tem system de ~1,2k + histórico + resposta de até 1,2k. É número de
   PRODUTO para calibrar com uso real; o mecanismo é o que importa aqui. */
const TETO_TOKENS_MES = 500_000;

const Pedido = z.object({
  thread_id: z.uuid().optional(),
  mensagem: z.string().trim().min(1).max(8000),
});

const VOZ_CONSULTOR = `Você é o Consultor de IA da Comunidade Subido — orienta
implementadores de IA sobre qual caminho seguir dentro da plataforma e nos
projetos deles.

Regras, sem exceção:
· Verbo concreto, resposta curta. Nada de "revolucionar", "transformar",
  "potencializar", "destravar", exclamação ou caixa alta.
· Toda estimativa vem com a premissa que a produziu.
· Quando o caso do usuário casa com uma solução do catálogo abaixo, recomende-a
  PELO NOME e diga o porquê em uma frase. Não invente solução que não está na
  lista.
· Quando o caso é um projeto novo que não existe no catálogo, aponte o Builder:
  é a ferramenta da plataforma que transforma a ideia em projeto completo.
· Quando faltar contexto para orientar bem, faça UMA pergunta — a que mais
  muda a resposta — em vez de responder no genérico.
· Você não promete resultado nem renda. Orienta caminho e mecanismo.
· Responda em texto corrido, sem markdown — a tela mostra o texto como ele vem,
  e asteriscos crus leem como defeito.`;

export async function responder(req: Request): Promise<Response> {
  try {
    const supabase = clienteDoChamador(req);
    if (!supabase) return respostaJson({ erro: 'Faça login para usar o Consultor.' }, 401);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return respostaJson({ erro: 'Faça login para usar o Consultor.' }, 401);

    const corpo = Pedido.safeParse(await req.json());
    if (!corpo.success) return respostaJson({ erro: 'Pedido inválido.', tipo: 'falha' }, 400);

    const { mensagem } = corpo.data;
    let threadId = corpo.data.thread_id ?? null;

    /* O LIMITE VEM ANTES de qualquer gravação: estourou, nada é criado — nem
       thread, nem mensagem pendurada sem resposta. */
    const mesAtual = new Date().toISOString().slice(0, 8) + '01';
    const { data: uso } = await supabase
      .from('consultor_uso')
      .select('tokens')
      .eq('mes', mesAtual)
      .maybeSingle();
    if ((uso?.tokens ?? 0) >= TETO_TOKENS_MES) {
      return respostaJson(
        {
          erro: 'Você atingiu o limite mensal do Consultor. Ele zera no primeiro dia do próximo mês.',
          tipo: 'limite',
        },
        429,
      );
    }

    /* Sem thread: a primeira mensagem CRIA a conversa, e o título nasce dela —
       corte na palavra, como a trilha do cabeçalho faz. */
    if (!threadId) {
      const bruto = mensagem.replace(/\s+/g, ' ').trim();
      const corte = bruto.slice(0, 80);
      const espaco = corte.lastIndexOf(' ');
      const titulo =
        bruto.length <= 80 ? bruto : `${espaco > 48 ? corte.slice(0, espaco) : corte}…`;

      const { data, error } = await supabase
        .from('consultor_threads')
        .insert({ dono: user.id, titulo })
        .select('id')
        .single();
      if (error) {
        console.error('[consultor] criar thread:', error);
        return respostaJson({ erro: 'Não foi possível iniciar a conversa.', tipo: 'falha' }, 500);
      }
      threadId = data.id;
    } else {
      /* RLS decide: id alheio ou inexistente devolve zero linhas, sem distinguir. */
      const { data } = await supabase
        .from('consultor_threads')
        .select('id')
        .eq('id', threadId)
        .maybeSingle();
      if (!data) return respostaJson({ erro: 'Conversa não encontrada.', tipo: 'falha' }, 404);
    }

    const { error: erroMsg } = await supabase
      .from('consultor_mensagens')
      .insert({ thread_id: threadId, papel: 'usuario', conteudo: mensagem });
    if (erroMsg) {
      console.error('[consultor] gravar pergunta:', erroMsg);
      return respostaJson({ erro: 'Não foi possível enviar a mensagem.', tipo: 'falha' }, 500);
    }

    /* Histórico: as últimas 20 mensagens bastam para uma conversa de orientação
       e mantêm o custo por rodada com teto conhecido. */
    const { data: historico } = await supabase
      .from('consultor_mensagens')
      .select('papel, conteudo')
      .eq('thread_id', threadId)
      .order('criado_em', { ascending: false })
      .limit(20);

    const mensagens = (historico ?? []).reverse().map((m) => ({
      role: m.papel === 'usuario' ? ('user' as const) : ('assistant' as const),
      content: m.conteudo,
    }));

    /* O catálogo real, lido com a identidade do chamador. */
    const { data: solucoes } = await supabase
      .from('solucoes')
      .select('titulo, slug, resumo, categoria')
      .eq('status', 'publicado')
      .order('ordem')
      .limit(20);

    const catalogo = (solucoes ?? [])
      .map((s) => `· ${s.titulo} (${s.categoria ?? 'sem categoria'}) — ${s.resumo}`)
      .join('\n');

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new ErroDoBuilder(
        'O Consultor está sem chave de modelo nos secrets do projeto (ANTHROPIC_API_KEY).',
        'sem-chave',
      );
    }
    const anthropic = new Anthropic({ apiKey });

    const resposta = await anthropic.messages.create({
      model: MODELO_CHAT,
      max_tokens: 1200,
      system: `${VOZ_CONSULTOR}\n\nCATÁLOGO DE SOLUÇÕES DA PLATAFORMA (real, atual):\n${catalogo}`,
      messages: mensagens,
    });

    const texto = resposta.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    if (!texto) throw new ErroDoBuilder('O consultor não devolveu resposta.', 'falha');

    /* CARTÕES INLINE, detectados no texto FINAL — determinístico, sem depender
       de o modelo formatar nada: solução do catálogo citada pelo nome vira
       ponteiro {slug, titulo, categoria}. Até 3; mais que isso é lista, e lista
       já é o catálogo. */
    const cartoes = (solucoes ?? [])
      .filter((s) => texto.toLowerCase().includes(s.titulo.toLowerCase()))
      .slice(0, 3)
      .map((s) => ({ slug: s.slug, titulo: s.titulo, categoria: s.categoria }));

    const { error: erroResposta } = await supabase.from('consultor_mensagens').insert({
      thread_id: threadId,
      papel: 'consultor',
      conteudo: texto.slice(0, 8000),
      cartoes: cartoes.length > 0 ? cartoes : null,
    });
    if (erroResposta) {
      console.error('[consultor] gravar resposta:', erroResposta);
      return respostaJson({ erro: 'A resposta veio mas não pôde ser salva.', tipo: 'falha' }, 500);
    }

    await supabase
      .from('consultor_threads')
      .update({ atualizado_em: new Date().toISOString() })
      .eq('id', threadId);

    /* Uso REAL da rodada, não estimativa: o SDK devolve a contagem. Upsert por
       (dono, mês); se a gravação do uso falhar, a resposta já foi entregue — o
       log fica como rastro e a rodada não é cobrada duas vezes. */
    const gastos = (resposta.usage?.input_tokens ?? 0) + (resposta.usage?.output_tokens ?? 0);
    const { error: erroUso } = await supabase.from('consultor_uso').upsert(
      {
        dono: user.id,
        mes: mesAtual,
        tokens: (uso?.tokens ?? 0) + gastos,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: 'dono,mes' },
    );
    if (erroUso) console.error('[consultor] uso:', erroUso);

    return respostaJson({ thread_id: threadId, resposta: texto, cartoes });
  } catch (erro) {
    try {
      throw traduzir(erro);
    } catch (traduzido) {
      return respostaDeErro(traduzido);
    }
  }
}
