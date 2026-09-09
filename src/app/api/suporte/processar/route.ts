import { timingSafeEqual } from 'node:crypto';
import { cronEnv } from '@/lib/env';
import { processarNotificacoesSuporte } from '@/lib/suporte/notificacoes';
import { limparAnexosSuporte } from '@/lib/suporte/limpeza';
import { processarEmailsSuporte } from '@/lib/suporte/email-recebido';

export const maxDuration = 120;
export async function GET(request: Request) {
  const config = cronEnv();
  const esperado = config ? `Bearer ${config.CRON_SECRET}` : '';
  const enviado = request.headers.get('authorization') ?? '';
  if (
    !esperado ||
    enviado.length !== esperado.length ||
    !timingSafeEqual(Buffer.from(enviado), Buffer.from(esperado))
  )
    return Response.json({ erro: 'Não autorizado.' }, { status: 401 });
  try {
    const recebidos = await processarEmailsSuporte();
    const notificacoes = await processarNotificacoesSuporte();
    const removidos = await limparAnexosSuporte();
    return Response.json(
      { ...notificacoes, ...recebidos, removidos },
      {
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  } catch {
    return Response.json({ erro: 'Fila indisponível.' }, { status: 503 });
  }
}
