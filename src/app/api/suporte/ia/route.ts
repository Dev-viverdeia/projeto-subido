import { z } from 'zod';
import {
  artigosSuporte,
  limitarSuporte,
  mesmaOrigem,
  usuarioSuporte,
  ipSuporte,
  criarSistemaSuporte,
} from '@/lib/suporte/servidor';
import { openAIEnv } from '@/lib/env';
import { responderAjuda } from '@/lib/suporte/ia';
import { jsonLimitado } from '@/lib/suporte/http';

export const maxDuration = 45;
const Pedido = z.object({
  pergunta: z.string().trim().min(3).max(2000),
  historico: z
    .array(z.object({ papel: z.enum(['usuario', 'ia']), texto: z.string().max(2400) }))
    .max(6)
    .default([]),
});
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export async function POST(request: Request) {
  try {
    if (!mesmaOrigem(request)) return json({ erro: 'Origem inválida.' }, 403);
    const pedido = Pedido.safeParse(await jsonLimitado(request));
    if (!pedido.success)
      return json({ erro: 'Escreva uma pergunta de até 2.000 caracteres.' }, 400);
    const user = await usuarioSuporte();
    const id = user?.id ?? ipSuporte(request);
    if (
      !(await limitarSuporte(id, 'ia-minuto', 6, 60)) ||
      !(await limitarSuporte(id, 'ia-dia', user ? 60 : 15, 86400)) ||
      !(await limitarSuporte('plataforma', 'ia-dia-global', 3000, 86400))
    )
      return json(
        {
          erro: 'O limite de perguntas da IA foi atingido por enquanto. Os guias e o atendimento da equipe continuam disponíveis.',
        },
        429,
      );
    const result = await responderAjuda(
      pedido.data.pergunta,
      pedido.data.historico,
      await artigosSuporte(),
    );
    if (result.tokens) {
      const { error } = await criarSistemaSuporte()
        .from('suporte_ia_uso')
        .insert({ tokens: result.tokens, modelo: openAIEnv().LIVE_COACH_MODEL });
      if (error) console.error('[suporte:uso]', error.code);
    }
    return json(result.resposta);
  } catch {
    return json(
      {
        erro: 'A IA não conseguiu responder agora. Consulte os guias ou envie seu pedido à equipe.',
      },
      503,
    );
  }
}
