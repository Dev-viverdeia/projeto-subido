import { NextResponse } from 'next/server';
import { z } from 'zod';
import { criarAdminSobral } from '@/lib/consultor/admin';
import { revalidarDirecaoOperacional } from '@/lib/consultor/revalidacao';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/types.generated';
import { ErroSobral } from '@/lib/consultor/modelo';
import { resolverRecomendacoes } from '@/lib/consultor/conteudo';
import {
  direcaoDaMensagem,
  obterUsoDoMes,
  persistirPlanoSobral,
  produzirLeituraSobral,
  registrarUsoSobral,
  TETO_TOKENS_SOBRAL_MES,
} from '@/lib/consultor/servico';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Pedido = z.object({
  thread_id: z.uuid(),
  mensagem: z.string().trim().min(1).max(8000).optional(),
  pendente: z.boolean().optional(),
});

function erro(mensagem: string, status: number, tipo = 'falha') {
  return NextResponse.json(
    { erro: mensagem, tipo },
    { status, headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return erro('Faça login para usar o Sobral AI.', 401);

    const corpo = Pedido.safeParse(await request.json().catch(() => null));
    if (!corpo.success) return erro('Pedido inválido.', 400);

    const pendente = corpo.data.pendente === true;
    const mensagem = corpo.data.mensagem?.trim() ?? null;
    if (!pendente && !mensagem) return erro('Escreva uma pergunta para continuar.', 400);

    const [thread, uso] = await Promise.all([
      supabase.from('consultor_threads').select('id').eq('id', corpo.data.thread_id).maybeSingle(),
      obterUsoDoMes(supabase),
    ]);

    if (thread.error) throw thread.error;
    if (!thread.data) return erro('Conversa não encontrada.', 404);
    if (uso >= TETO_TOKENS_SOBRAL_MES) {
      return erro(
        'Você atingiu o limite mensal do Sobral AI. Ele zera no primeiro dia do próximo mês.',
        429,
        'limite',
      );
    }

    if (!pendente && mensagem) {
      const { error: erroMensagem } = await supabase.from('consultor_mensagens').insert({
        thread_id: corpo.data.thread_id,
        papel: 'usuario',
        conteudo: mensagem,
      });
      if (erroMensagem) throw erroMensagem;
    }

    const { data: ultimas, error: erroHistorico } = await supabase
      .from('consultor_mensagens')
      .select('papel, conteudo, cartoes')
      .eq('thread_id', corpo.data.thread_id)
      .order('criado_em', { ascending: false })
      .limit(20);
    if (erroHistorico) throw erroHistorico;

    const ultima = ultimas?.[0];
    if (pendente && ultima?.papel === 'consultor') {
      return NextResponse.json(
        {
          thread_id: corpo.data.thread_id,
          resposta: ultima.conteudo,
          cartoes: ultima.cartoes ?? [],
        },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }
    if (!ultima) return erro('A conversa está vazia.', 400);

    const historico = [...(ultimas ?? [])].reverse().map((item) => ({
      papel: item.papel as 'usuario' | 'consultor',
      conteudo: item.conteudo,
    }));
    const leitura = await produzirLeituraSobral({
      supabase,
      usuarioId: user.id,
      historico,
      pedido: mensagem ?? ultima.conteudo,
    });

    const cartoes = resolverRecomendacoes(leitura.rodada.direcao.recomendacoes, leitura.sinais);

    const admin = criarAdminSobral();
    const { error: erroResposta } = await admin.from('consultor_mensagens').insert({
      thread_id: corpo.data.thread_id,
      papel: 'consultor',
      conteudo: leitura.rodada.direcao.resposta,
      cartoes: cartoes.length > 0 ? (cartoes as unknown as Json) : null,
      direcao: direcaoDaMensagem(leitura),
      modelo: leitura.rodada.modelo,
    });
    if (erroResposta) throw erroResposta;

    const [threadAtualizada, plano] = await Promise.allSettled([
      admin
        .from('consultor_threads')
        .update({ atualizado_em: new Date().toISOString() })
        .eq('id', corpo.data.thread_id)
        .eq('dono', user.id),
      persistirPlanoSobral(admin, user.id, leitura),
    ]);
    if (threadAtualizada.status === 'rejected') {
      console.error('[sobral:thread] falha ao atualizar:', threadAtualizada.reason);
    } else if (threadAtualizada.value.error) {
      console.error('[sobral:thread] falha ao atualizar:', threadAtualizada.value.error);
    }
    if (plano.status === 'rejected') {
      console.error('[sobral:plano] falha ao persistir:', plano.reason);
    }
    await registrarUsoSobral(admin, user.id, leitura.rodada.tokens);
    revalidarDirecaoOperacional();

    return NextResponse.json(
      {
        thread_id: corpo.data.thread_id,
        resposta: leitura.rodada.direcao.resposta,
        cartoes,
        direcao: direcaoDaMensagem(leitura),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (causa) {
    if (causa instanceof ErroSobral) {
      const status = causa.tipo === 'limite' ? 429 : causa.tipo === 'recusa' ? 400 : 503;
      return erro(causa.message, status, causa.tipo);
    }
    console.error('[sobral:responder] falha:', causa);
    return erro('Não foi possível responder agora. Tente de novo em instantes.', 500);
  }
}
