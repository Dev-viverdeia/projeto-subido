import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.110.9';
import { clienteDoChamador, respostaDeErro, respostaJson } from '../_compartilhado/http.ts';
import { ErroDoBuilder, MODELO, gerarDocumento, traduzir } from '../_compartilhado/modelo.ts';
import { PedidoGeracao, type RespostaClarificacao } from '../_compartilhado/schema.ts';

/* Global fornecida pelo Supabase Edge Runtime. A declaração local mantém este
   módulo verificável isoladamente pelo `deno check`; não gera código no bundle. */
declare const EdgeRuntime: {
  waitUntil<T>(promise: Promise<T>): Promise<T>;
};

/**
 * PASSO 2 DO BUILDER — o projeto, em TAREFA DE FUNDO.
 *
 * O DESENHO, E POR QUE ELE É ASSIM
 * A plataforma derruba com 504 qualquer função que não responda em 150s
 * (`request idle timeout`). A geração leva de 1 a 3 minutos. Segurar a conexão
 * até o fim, como fazia a versão da Vercel, estouraria esse teto na maioria das
 * gerações.
 *
 * Então a resposta sai em milissegundos — `202`, "aceitei, está gerando" — e o
 * trabalho continua em `EdgeRuntime.waitUntil`, que mantém o isolate vivo depois
 * do fim do request. O limite que passa a valer é o wall clock do isolate: 400s
 * no plano pro, contra 1 a 3 minutos de geração.
 *
 * O EFEITO COLATERAL É UMA MELHORA, não um remendo: fechar a aba deixou de
 * cancelar a geração. Antes, o trabalho vivia na conexão HTTP; agora vive no
 * isolate e desemboca no banco de qualquer forma. Quem voltar depois encontra o
 * projeto pronto.
 *
 * A INTERFACE JÁ ESPERAVA POR ISSO. `EstadoGeracao` foi escrito para o caso de
 * alguém abrir uma solução `gerando` de outra aba: ele re-renderiza o RSC a cada
 * 6s até o status mudar. Com a tarefa de fundo, esse deixa de ser o caso de borda
 * e vira O caso — e por isso o cronômetro da `Entrevista` saiu: dois estados de
 * espera diferentes para a mesma espera é o que fazia a tela parecer duas telas.
 */
export async function gerar(req: Request): Promise<Response> {
  try {
    const supabase = clienteDoChamador(req);
    if (!supabase) return respostaJson({ erro: 'Faça login para usar o Builder.' }, 401);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return respostaJson({ erro: 'Faça login para usar o Builder.' }, 401);
    if (!['pro', 'enterprise'].includes(String(user.app_metadata?.plano_subido))) {
      return respostaJson({ erro: 'O Estúdio está disponível a partir do plano Pro.' }, 403);
    }

    const corpo = PedidoGeracao.safeParse(await req.json());
    if (!corpo.success) return respostaJson({ erro: 'Pedido inválido.', tipo: 'falha' }, 400);

    const { id, respostas } = corpo.data;

    const chave = Deno.env.get('BUILDER_WORKER_KEY');
    if (!chave) return respostaJson({ erro: 'O Estúdio está indisponível agora.' }, 503);
    // Claim e insumos são decididos na mesma transação. O JWT conserva dono/RLS;
    // a credencial privada impede chamar a finalização diretamente pelo browser.
    const { data: reserva, error: erroStatus } = await supabase.rpc('builder_iniciar_geracao', {
      p_id: id,
      p_respostas: respostas,
      p_chave: chave,
    });
    if (erroStatus) {
      console.error('[builder:gerar] reserva recusada', erroStatus.code);
      return respostaJson(
        {
          erro:
            erroStatus.message === 'limite_builder_simultaneo'
              ? 'Você já tem projetos sendo preparados. Aguarde um terminar.'
              : 'Não foi possível iniciar o projeto. Tente novamente.',
          tipo: 'falha',
        },
        erroStatus.message === 'limite_builder_simultaneo' ? 429 : 409,
      );
    }
    if (!reserva?.executar) return respostaJson({ id, jaGerando: true }, 202);

    /* A partir daqui o trabalho é de fundo. Nada do que acontecer nele chega ao
       cliente por esta resposta — chega pelo BANCO, que é o que a tela lê. */
    EdgeRuntime.waitUntil(
      gerarEGravar(supabase, id, reserva.tentativa, chave, reserva.ideia, respostas),
    );

    return respostaJson({ id }, 202);
  } catch (erro) {
    return respostaDeErro(erro);
  }
}

/**
 * A geração propriamente dita. Roda DEPOIS da resposta HTTP.
 *
 * Não lança: um erro que escapasse daqui morreria num isolate que ninguém está
 * observando, e a solução ficaria em `gerando` para sempre. Toda saída — sucesso
 * ou falha — é uma escrita no banco, porque a escrita é a única coisa que a tela
 * consegue ver.
 */
async function gerarEGravar(
  supabase: SupabaseClient,
  id: string,
  tentativa: string,
  chave: string,
  ideia: string,
  respostas: RespostaClarificacao[],
): Promise<void> {
  try {
    const documento = await gerarDocumento(ideia, respostas);

    const { error } = await supabase.rpc('builder_finalizar_geracao', {
      p_id: id,
      p_tentativa: tentativa,
      p_chave: chave,
      p_documento: documento,
      p_modelo: MODELO,
    });

    if (error) throw new ErroDoBuilder('O projeto foi gerado mas não pôde ser salvo.', 'falha');
  } catch (erro) {
    const traduzido = traduzir(erro);
    console.error(`[builder:gerar] ${id}: ${traduzido.tipo} — ${traduzido.message}`);
    /* O erro CRU também, senão o log só guarda a tradução — e a primeira falha
       real provou que a tradução não distingue corte de token de schema violado. */
    if (!(erro instanceof ErroDoBuilder)) {
      console.error(`[builder:gerar] ${id}: erro original —`, erro);
    }

    const { error } = await supabase.rpc('builder_finalizar_geracao', {
      p_id: id,
      p_tentativa: tentativa,
      p_chave: chave,
      p_erro: traduzido.message,
    });

    /* Se nem a gravação da falha funcionar, o único lugar que resta é o log. A
       solução fica em `gerando`, e é para isso que a tela tem a saída manual de
       volta para a entrevista. */
    if (error) console.error(`[builder:gerar] ${id}: falha ao gravar a falha`, error);
  }
}
