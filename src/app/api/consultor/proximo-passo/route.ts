import { NextResponse } from 'next/server';
import { z } from 'zod';
import { criarAdminSobral } from '@/lib/consultor/admin';
import { ErroSobral, gerarProximaAcaoDoLead } from '@/lib/consultor/modelo';
import { obterContextoProximoPasso } from '@/lib/consultor/proximo-passo';
import { criarRecomendacaoFallback } from '@/lib/consultor/recomendacao';
import { obterUsoDoMes, registrarUsoSobral, TETO_TOKENS_SOBRAL_MES } from '@/lib/consultor/servico';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/types.generated';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Pedido = z.object({ mensagem: z.uuid() });

function resposta(mensagem: string, status: number) {
  return NextResponse.json({ mensagem }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return resposta('Faça login para continuar.', 401);

    const pedido = Pedido.safeParse(await request.json().catch(() => null));
    if (!pedido.success) return resposta('Pedido inválido.', 400);

    const { data: acao, error: erroAcao } = await supabase
      .from('sobral_acoes_crm')
      .select('mensagem_id, oportunidade_id, status')
      .eq('mensagem_id', pedido.data.mensagem)
      .maybeSingle();
    if (erroAcao) throw erroAcao;
    if (!acao || acao.status !== 'concluida') {
      return resposta('Esta ação ainda não está pronta para uma nova recomendação.', 409);
    }

    const { data: existente, error: erroExistente } = await supabase
      .from('sobral_recomendacoes_crm')
      .select('mensagem_id, status')
      .eq('mensagem_id', pedido.data.mensagem)
      .maybeSingle();
    if (erroExistente) throw erroExistente;
    if (existente?.status === 'pendente') {
      return NextResponse.json({ status: 'pronta' }, { headers: { 'Cache-Control': 'no-store' } });
    }

    const leitura = await obterContextoProximoPasso(supabase, acao.oportunidade_id);
    if (!leitura) return resposta('Esta venda não está mais disponível.', 404);

    const uso = await obterUsoDoMes(supabase);
    let recomendacao = criarRecomendacaoFallback(leitura.contexto);

    if (uso < TETO_TOKENS_SOBRAL_MES) {
      try {
        recomendacao = await gerarProximaAcaoDoLead({
          usuarioId: user.id,
          contexto: leitura.contexto,
        });
      } catch (erro) {
        if (!(erro instanceof ErroSobral)) throw erro;
        console.warn(`[sobral:proximo-passo] fallback factual: ${erro.tipo}`);
      }
    }

    const { error: erroInsert } = await supabase.from('sobral_recomendacoes_crm').upsert(
      {
        mensagem_id: pedido.data.mensagem,
        dono: user.id,
        oportunidade_id: acao.oportunidade_id,
        acao: recomendacao.acao,
        motivo: recomendacao.motivo,
        fatos: recomendacao.fatos as unknown as Json,
        quando: recomendacao.quando,
        status: 'pendente',
        modelo: recomendacao.modelo,
        resposta_id: recomendacao.respostaId,
        contexto_hash: leitura.contextoHash,
        gerada_em: new Date().toISOString(),
        confirmada_em: null,
      },
      { onConflict: 'mensagem_id' },
    );
    if (erroInsert) throw erroInsert;

    if (recomendacao.tokens > 0) {
      await registrarUsoSobral(criarAdminSobral(), user.id, recomendacao.tokens);
    }

    return NextResponse.json({ status: 'pronta' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (erro) {
    console.error('[sobral:proximo-passo] falha:', erro);
    return resposta('Não foi possível analisar o próximo passo agora.', 500);
  }
}
