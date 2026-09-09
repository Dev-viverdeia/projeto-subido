import { timingSafeEqual } from 'node:crypto';
import { cronEnv } from '@/lib/env';
import { processarNotificacoesSuporte } from '@/lib/suporte/notificacoes';
import { limparAnexosSuporte } from '@/lib/suporte/limpeza';
import { processarEmailsSuporte } from '@/lib/suporte/email-recebido';
import { observarSuporte } from '@/lib/operacoes/pulso';

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
  // 50 + 35 + 8s de trabalho e até 3s por recibo; sobra margem para DNS e a rota.
  // Uma falha de entrada não impede o envio nem a limpeza. Sem Promise.race:
  // o prazo cancela as requisições reais em vez de abandoná-las em segundo plano.
  const falhas: string[] = [];
  const recebidos = await observarSuporte(
    'recebimento',
    () => processarEmailsSuporte(AbortSignal.timeout(50_000)),
    (r) => r.falhasRecebimento > 0,
  ).catch(() => {
    falhas.push('recebimento');
    // O ciclo pode ter processado parte do lote antes da falha. Não inventa zero.
    return { incorporados: null, revisao: null, falhasRecebimento: 1 };
  });
  const notificacoes = await observarSuporte(
    'envio',
    () => processarNotificacoesSuporte(AbortSignal.timeout(35_000)),
    (r) => r.falhas > 0,
  ).catch(() => {
    falhas.push('envio');
    return { enviadas: null, falhas: 1 };
  });
  const removidos = await observarSuporte('limpeza', () =>
    limparAnexosSuporte(AbortSignal.timeout(8_000)),
  ).catch(() => {
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
