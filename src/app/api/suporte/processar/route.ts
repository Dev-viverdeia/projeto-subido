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
  // Ciclos independentes e sequenciais: 55 + 40 + 10s, dentro dos 120s da rota.
  // Uma falha de entrada não impede o envio nem a limpeza. Sem Promise.race:
  // o prazo cancela as requisições reais em vez de abandoná-las em segundo plano.
  const falhas: string[] = [];
  const recebidos = await processarEmailsSuporte().catch(() => {
    falhas.push('recebimento');
    // O ciclo pode ter processado parte do lote antes da falha. Não inventa zero.
    return { incorporados: null, revisao: null, falhasRecebimento: 1 };
  });
  const notificacoes = await processarNotificacoesSuporte().catch(() => {
    falhas.push('envio');
    return { enviadas: null, falhas: 1 };
  });
  const removidos = await limparAnexosSuporte().catch(() => {
    falhas.push('limpeza');
    return 0;
  });
  return Response.json(
    { ...notificacoes, ...recebidos, removidos, filasIndisponiveis: falhas },
    {
      status: falhas.length || notificacoes.falhas || recebidos.falhasRecebimento ? 503 : 200,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
