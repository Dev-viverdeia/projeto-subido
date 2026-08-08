import { NextResponse } from 'next/server';
import { criarAdminSobral } from '@/lib/consultor/admin';
import { createClient } from '@/lib/supabase/server';
import { ErroSobral } from '@/lib/consultor/modelo';
import {
  obterUsoDoMes,
  persistirPlanoSobral,
  produzirLeituraSobral,
  registrarUsoSobral,
  TETO_TOKENS_SOBRAL_MES,
} from '@/lib/consultor/servico';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function erro(mensagem: string, status: number, tipo = 'falha') {
  return NextResponse.json(
    { erro: mensagem, tipo },
    { status, headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return erro('Faça login para atualizar sua direção.', 401);

    const uso = await obterUsoDoMes(supabase);
    if (uso >= TETO_TOKENS_SOBRAL_MES) {
      return erro(
        'Você atingiu o limite mensal do Sobral AI. Ele zera no primeiro dia do próximo mês.',
        429,
        'limite',
      );
    }

    const leitura = await produzirLeituraSobral({
      supabase,
      usuarioId: user.id,
      historico: [],
      pedido:
        'Leia os fatos da minha operação e atualize minha direção. Diga o que merece atenção agora, escolha um próximo passo e organize três ações em ordem.',
    });
    const admin = criarAdminSobral();
    await persistirPlanoSobral(admin, user.id, leitura);
    await registrarUsoSobral(admin, user.id, leitura.rodada.tokens);

    return NextResponse.json(
      { plano: leitura.plano },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (causa) {
    if (causa instanceof ErroSobral) {
      const status = causa.tipo === 'limite' ? 429 : causa.tipo === 'recusa' ? 400 : 503;
      return erro(causa.message, status, causa.tipo);
    }
    console.error('[sobral:direcao] falha:', causa);
    return erro('Não foi possível atualizar sua direção agora. Tente novamente.', 500);
  }
}
