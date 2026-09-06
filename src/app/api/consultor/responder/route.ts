import { after, NextResponse } from 'next/server';
import { z } from 'zod';
import { criarAdminSobral } from '@/lib/consultor/admin';
import { executarGeracao } from '@/lib/consultor/executar-geracao';
import { GeracaoSobralSchema, type EventoSobral } from '@/lib/consultor/geracao-contrato';
import { obterUsoDoMes, TETO_TOKENS_SOBRAL_MES } from '@/lib/consultor/servico';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 180;
const headers = { 'Cache-Control': 'no-store' };
const Pedido = z.object({
  thread_id: z.uuid(),
  mensagem_id: z.uuid().optional(),
  tentativa: z.uuid().optional(),
  repetir: z.boolean().default(false),
  pendente: z.boolean().optional(),
});
const Recibo = z.object({ executar: z.boolean(), geracao: GeracaoSobralSchema });
const json = (dados: unknown, status = 200) => NextResponse.json(dados, { status, headers });

/** Lê o recibo; não chama o modelo. */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return json({ erro: 'Faça login para usar o Sobral AI.' }, 401);
    const mensagem = z.uuid().safeParse(new URL(request.url).searchParams.get('mensagem_id'));
    if (!mensagem.success) return json({ erro: 'Pergunta inválida.' }, 400);
    const admin = criarAdminSobral();
    // O worker termina antes da lease. Uma queda definitiva não prende o chat.
    const { error: expirada } = await admin
      .from('sobral_geracoes')
      .update({ estado: 'interrompida', erro: 'Resposta interrompida.' })
      .eq('mensagem_id', mensagem.data)
      .eq('dono', user.id)
      .eq('estado', 'gerando')
      .lt('expira_em', new Date().toISOString());
    if (expirada) throw expirada;
    const { data, error } = await supabase
      .from('sobral_geracoes')
      .select('*')
      .eq('mensagem_id', mensagem.data)
      .maybeSingle();
    if (error) throw error;
    return data
      ? json({ geracao: GeracaoSobralSchema.parse(data) })
      : json({ erro: 'Resposta não encontrada.' }, 404);
  } catch {
    return json({ erro: 'Não foi possível conferir a resposta agora.' }, 503);
  }
}

/** Um clique atrasado só pode parar sua própria tentativa. */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return json({ erro: 'Faça login para usar o Sobral AI.' }, 401);
    const pedido = z
      .object({ mensagem_id: z.uuid(), tentativa: z.uuid() })
      .safeParse(await request.json().catch(() => null));
    if (!pedido.success) return json({ erro: 'Pedido inválido.' }, 400);
    const admin = criarAdminSobral();
    const { error } = await admin
      .from('sobral_geracoes')
      .update({ parar_em: new Date().toISOString() })
      .eq('mensagem_id', pedido.data.mensagem_id)
      .eq('tentativa', pedido.data.tentativa)
      .eq('dono', user.id)
      .eq('estado', 'gerando');
    if (error) throw error;
    const { data, error: erroLeitura } = await supabase
      .from('sobral_geracoes')
      .select('*')
      .eq('mensagem_id', pedido.data.mensagem_id)
      .eq('tentativa', pedido.data.tentativa)
      .maybeSingle();
    if (erroLeitura) throw erroLeitura;
    return data
      ? json({ geracao: GeracaoSobralSchema.parse(data) })
      : json({ erro: 'Resposta não encontrada.' }, 404);
  } catch {
    return json({ erro: 'Não foi possível confirmar a interrupção. Tente novamente.' }, 503);
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return json({ erro: 'Faça login para usar o Sobral AI.' }, 401);
    const pedido = Pedido.safeParse(await request.json().catch(() => null));
    if (!pedido.success) return json({ erro: 'Pedido inválido.' }, 400);
    const { data: thread, error } = await supabase
      .from('consultor_threads')
      .select('id')
      .eq('id', pedido.data.thread_id)
      .maybeSingle();
    if (error) throw error;
    if (!thread) return json({ erro: 'Conversa não encontrada.' }, 404);
    const { data: ultima, error: erroUltima } = await supabase
      .from('consultor_mensagens')
      .select('id, papel, conteudo')
      .eq('thread_id', thread.id)
      .order('criado_em', { ascending: false })
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (erroUltima) throw erroUltima;
    if (!pedido.data.mensagem_id && ultima?.papel === 'consultor')
      return json({ thread_id: thread.id, resposta: ultima.conteudo });
    const mensagemId = pedido.data.mensagem_id ?? ultima?.id;
    if (!mensagemId) return json({ erro: 'Envie uma pergunta para continuar.' }, 400);
    if ((await obterUsoDoMes(supabase)) >= TETO_TOKENS_SOBRAL_MES)
      return json({ erro: 'Você atingiu o limite mensal do Sobral AI.', tipo: 'limite' }, 429);
    const admin = criarAdminSobral();
    const { data, error: erroInicio } = await admin.rpc('sobral_iniciar_geracao', {
      p_dono: user.id,
      p_thread: thread.id,
      p_mensagem: mensagemId,
      p_tentativa: pedido.data.tentativa ?? crypto.randomUUID(),
      p_repetir: pedido.data.repetir,
    });
    if (erroInicio)
      return json({ erro: 'Confira a resposta existente antes de enviar outra pergunta.' }, 409);
    const recibo = Recibo.parse(data);
    if (!recibo.executar)
      return json(
        { geracao: recibo.geracao, thread_id: thread.id, resposta: recibo.geracao.texto },
        recibo.geracao.estado === 'gerando' ? 202 : 200,
      );
    const controle = new AbortController();
    const interromper = () => controle.abort('conexao');
    request.signal.addEventListener('abort', interromper, { once: true });
    if (request.signal.aborted) interromper();
    if (!request.headers.get('accept')?.includes('application/x-ndjson')) {
      const geracao = await executarGeracao({
        supabase,
        dono: user.id,
        geracao: recibo.geracao,
        controle,
        emitir: () => {},
      });
      request.signal.removeEventListener('abort', interromper);
      return json(
        { geracao, thread_id: thread.id, resposta: geracao?.texto ?? '' },
        geracao?.estado === 'concluida' ? 200 : 503,
      );
    }
    const encoder = new TextEncoder();
    let aberta = true;
    let terminar!: Promise<void>;
    const stream = new ReadableStream<Uint8Array>({
      start(destino) {
        const emitir = (evento: EventoSobral) => {
          if (!aberta) return;
          try {
            destino.enqueue(encoder.encode(`${JSON.stringify(evento)}\n`));
          } catch {
            aberta = false;
            interromper();
          }
        };
        emitir({ tipo: 'estado', geracao: recibo.geracao });
        terminar = executarGeracao({
          supabase,
          dono: user.id,
          geracao: recibo.geracao,
          controle,
          emitir,
        })
          .catch(() =>
            emitir({
              tipo: 'erro',
              mensagem: 'Confira a resposta salva antes de tentar novamente.',
            }),
          )
          .finally(() => {
            request.signal.removeEventListener('abort', interromper);
            if (aberta) {
              aberta = false;
              destino.close();
            }
          })
          .then(() => {});
      },
      cancel() {
        aberta = false;
        interromper();
      },
    });
    after(() => terminar);
    return new Response(stream, {
      headers: {
        ...headers,
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch {
    return json({ erro: 'Não foi possível iniciar a resposta. Tente novamente.' }, 503);
  }
}
