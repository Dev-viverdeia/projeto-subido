/** Opt-in. Envia somente aos endereços oficiais de teste do Resend. */
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { setTimeout as esperar } from 'node:timers/promises';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import assert from 'node:assert/strict';

if (!process.argv.includes('--confirmar-teste')) throw new Error('Use --confirmar-teste.');
const app = process.env.SUBIDO_APP_URL || 'http://127.0.0.1:3012';
assert(['127.0.0.1', 'localhost', 'subido.viverdeia.ai'].includes(new URL(app).hostname));
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const resend = new Resend(process.env.QA_RESEND_READ_KEY || process.env.RESEND_API_KEY);
const exigir = ({ data, error }) => {
  if (error) throw new Error(error.code || 'erro_banco');
  return data;
};
const alvo = process.argv.includes('--devolucao') ? 'bounced' : 'delivered';
const id = randomUUID();
const email = `${alvo}+subido-suporte-${Date.now()}@resend.dev`;
const segredo = randomBytes(32).toString('hex');
const hash = createHash('sha256').update(segredo).digest('hex');
const link = new URL('/api/suporte/acesso', app);
link.searchParams.set('id', id);
link.searchParams.set('chave', segredo);
try {
  // Recusa disparar a fila se houver qualquer destinatário fora do teste.
  const pendentes = exigir(
    await db
      .from('suporte_notificacoes')
      .select('id')
      .in('estado', ['pendente', 'falhou', 'enviando']),
  );
  assert.equal(pendentes.length, 0, 'Há notificações pendentes. Não executar este teste agora.');
  exigir(
    await db.rpc('suporte_publico_criar', {
      p_id: id,
      p_email: email,
      p_assunto: 'QA: entrega de notificação',
      p_texto: 'Teste controlado do fluxo de notificação do suporte.',
      p_hash: hash,
      p_url: link.toString(),
    }),
  );
  exigir(
    await db
      .from('suporte_notificacoes')
      .update({ atualizado_em: new Date(Date.now() - 120_000).toISOString() })
      .eq('atendimento', id),
  );
  const processar = await fetch(`${app}/api/suporte/processar`, {
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
    signal: AbortSignal.timeout(60_000),
  });
  assert.equal(processar.status, 200, 'Worker indisponível');
  let aviso;
  let ultimoEvento;
  for (let i = 0; i < 18; i++) {
    aviso = exigir(
      await db
        .from('suporte_notificacoes')
        .select('estado,provider_id,tentativas')
        .eq('atendimento', id)
        .single(),
    );
    if (aviso.provider_id) {
      const r = await resend.emails.get(aviso.provider_id);
      if (r.error) throw new Error(`consulta_resend: ${r.error.name}`);
      ultimoEvento = r.data.last_event;
      if (
        ultimoEvento === alvo &&
        (!process.argv.includes('--exigir-webhook') ||
          aviso.estado === (alvo === 'delivered' ? 'entregue' : 'devolvido'))
      )
        break;
    }
    await esperar(3000);
  }
  assert.equal(ultimoEvento, alvo, 'Evento do provedor não confirmado');
  if (process.argv.includes('--exigir-webhook'))
    assert.equal(aviso.estado, alvo === 'delivered' ? 'entregue' : 'devolvido');
  console.log(
    JSON.stringify({
      destino: 'endereço oficial de teste Resend',
      evento: ultimoEvento,
      estado: aviso.estado,
      tentativas: aviso.tentativas,
      webhook: process.argv.includes('--exigir-webhook'),
    }),
  );
} finally {
  exigir(await db.from('suporte_atendimentos').delete().eq('id', id));
}
