/** Opt-in: somente as duas caixas do proprietário. Nunca imprime tokens ou links pessoais. */
import assert from 'node:assert/strict';
import { randomBytes, randomUUID, createHmac } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { chromium, expect as expectBase } from '@playwright/test';
import { Resend } from 'resend';

assert(process.argv.includes('--confirmar-teste'), 'Use --confirmar-teste.');
const app = 'https://subido.viverdeia.ai';
const prefixo = 'QA-SUPORTE-20260909-';
const permitidos = ['rafael@viverdeia.ai', 'rafaelmilagre@hotmail.com'];
const emailAgente = 'qa-suporte-caixas-20260909@example.invalid';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
assert.equal(new URL(url).hostname, 'fopljjqxituhajzwjrjt.supabase.co');
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const db = createClient(url, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const resend = new Resend(process.env.SUPORTE_EMAIL_API_KEY);
const exigir = ({ data, error }) => {
  if (error) throw new Error(`QA: ${error.code ?? error.name ?? 'falha'}`);
  return data;
};
const expect = expectBase.configure({ timeout: 30_000 });
const casos = exigir(
  await db.from('suporte_atendimentos').select('*').like('assunto', `${prefixo}%`),
);
assert(casos.length > 0 && casos.length <= 2, 'Esperando os dois pedidos identificados.');
assert(casos.every((c) => permitidos.includes(c.email) && !c.dono));
const original = exigir(await db.auth.admin.listUsers({ page: 1, perPage: 1000 })).users;
let agente = original.find((u) => u.email === emailAgente);
const modo = process.argv[2];
if (modo === 'replay') {
  const ids = casos.map((c) => c.id);
  const antes = exigir(await db.from('suporte_mensagens').select('id').in('atendimento', ids));
  for (const c of casos) {
    const payload = JSON.stringify({
      type: 'email.received',
      created_at: new Date().toISOString(),
      data: { email_id: c.id, to: ['ajuda@subido.viverdeia.ai'] },
    });
    for (let i = 0; i < 2; i++) {
      const id = `msg_${randomUUID()}`,
        timestamp = String(Math.floor(Date.now() / 1000));
      const signature = createHmac(
        'sha256',
        Buffer.from(process.env.SUPORTE_EMAIL_WEBHOOK_SECRET.replace(/^whsec_/, ''), 'base64'),
      )
        .update(`${id}.${timestamp}.${payload}`)
        .digest('base64');
      const r = await fetch(`${app}/api/suporte/email`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'svix-id': id,
          'svix-timestamp': timestamp,
          'svix-signature': `v1,${signature}`,
        },
        body: payload,
      });
      assert.equal(r.status, 200);
    }
    const evento = exigir(
      await db.from('suporte_email_recebidos').select('estado').eq('id', c.id).single(),
    );
    assert.equal(evento.estado, 'processado');
  }
  assert.equal(
    exigir(await db.from('suporte_mensagens').select('id').in('atendimento', ids)).length,
    antes.length,
  );
  console.log(
    'Replay assinado de quatro webhooks: sem novas mensagens, reprocessamento ou reabertura.',
  );
  process.exit(0);
}
if (modo === 'limpar') {
  assert(
    casos.every((c) => c.status === 'resolvido'),
    'Resolver o teste antes de limpar.',
  );
  const avisos = exigir(
    await db
      .from('suporte_notificacoes')
      .select('estado')
      .in(
        'atendimento',
        casos.map((c) => c.id),
      ),
  );
  assert(
    avisos.every((a) => a.estado === 'entregue'),
    'Aguardar a entrega antes de limpar.',
  );
  assert(!agente || agente.app_metadata.qa_suporte === true, 'Agente não identificado como QA.');
  const arquivos = exigir(
    await db
      .from('suporte_arquivos')
      .select('caminho,suporte_mensagens!inner(atendimento)')
      .in(
        'suporte_mensagens.atendimento',
        casos.map((c) => c.id),
      ),
  );
  if (arquivos.length)
    exigir(await db.storage.from('suporte-privado').remove(arquivos.map((a) => a.caminho)));
  // Desvincular antes do cascade: uma repetição tardia não deve recriar o teste.
  // Só ficam identificadores do provedor, sem conteúdo ou vínculo com a pessoa.
  exigir(
    await db
      .from('suporte_email_recebidos')
      .update({
        atendimento: null,
        mensagem: null,
        message_id: null,
        estado: 'ignorado',
        motivo: 'qa_removido',
      })
      .in(
        'atendimento',
        casos.map((c) => c.id),
      ),
  );
  exigir(
    await db
      .from('suporte_atendimentos')
      .delete()
      .in(
        'id',
        casos.map((c) => c.id),
      ),
  );
  if (agente) exigir(await db.auth.admin.deleteUser(agente.id));
  console.log('Removidos somente os dois atendimentos de QA, seus anexos e o agente de teste.');
  process.exit(0);
}
if (modo === 'conferir') {
  for (const c of casos) {
    const mensagens = exigir(
      await db.from('suporte_mensagens').select('id,texto,canal,interna').eq('atendimento', c.id),
    );
    const replies = mensagens.filter((m) => m.texto.includes('REPLICA-QA-'));
    assert.equal(replies.length, 1, 'A réplica deve aparecer uma vez.');
    assert.equal(replies[0].canal, 'email');
    assert.equal(c.status, 'em_atendimento');
    assert.equal(c.reaberturas, 1);
    const notificacoes = exigir(
      await db.from('suporte_notificacoes').select('estado,tipo').eq('atendimento', c.id),
    );
    assert(notificacoes.filter((n) => n.tipo === 'usuario').every((n) => n.estado === 'entregue'));
    console.log(
      JSON.stringify({
        numero: c.numero,
        estado: c.status,
        reaberturas: c.reaberturas,
        replicaUnica: true,
        notificacoes,
      }),
    );
  }
  process.exit(0);
}
assert(['responder', 'encerrar'].includes(modo));
if (!agente) {
  agente = exigir(
    await db.auth.admin.createUser({
      email: emailAgente,
      password: randomBytes(32).toString('base64url'),
      email_confirm: true,
      user_metadata: {
        nome: 'QA Atendimento',
        introducao_subido_concluida_em: new Date().toISOString(),
      },
      app_metadata: { plano_subido: 'starter', qa_suporte: true },
    }),
  ).user;
  exigir(
    await db
      .from('suporte_agentes')
      .insert({ usuario: agente.id, nome: 'QA Atendimento', notificar: false }),
  );
}
const browser = await chromium.launch();
try {
  const cookies = new Map();
  const client = createServerClient(url, key, {
    cookies: {
      getAll: () => [...cookies.values()],
      setAll: (novos) => novos.forEach((c) => cookies.set(c.name, c)),
    },
  });
  const acesso = exigir(
    await db.auth.admin.generateLink({ type: 'magiclink', email: emailAgente }),
  );
  exigir(
    await client.auth.verifyOtp({ type: 'magiclink', token_hash: acesso.properties.hashed_token }),
  );
  const contexto = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await contexto.addCookies(
    [...cookies.values()].map(({ name, value }) => ({
      name,
      value,
      domain: 'subido.viverdeia.ai',
      path: '/',
      secure: true,
      sameSite: 'Lax',
    })),
  );
  const page = await contexto.newPage();
  const pasta = '/private/tmp/subido-suporte-caixas-reais';
  await mkdir(pasta, { recursive: true });
  for (const c of casos) {
    // Atribuir antes da confirmação evita avisos de QA aos atendentes reais.
    exigir(await db.from('suporte_atendimentos').update({ responsavel: agente.id }).eq('id', c.id));
    const aviso = exigir(
      await db
        .from('suporte_notificacoes')
        .select('provider_id,estado')
        .eq('atendimento', c.id)
        .eq('tipo', 'verificar')
        .single(),
    );
    assert.equal(aviso.estado, 'entregue', 'Aguardar confirmação de entrega pelo webhook.');
    const email = exigir(await resend.emails.get(aviso.provider_id));
    const link = email.text.match(
      /https:\/\/subido\.viverdeia\.ai\/api\/suporte\/acesso\?[^\s]+/,
    )?.[0];
    assert(link, 'Link de confirmação ausente.');
    const contextoCliente = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const cliente = await contextoCliente.newPage();
    await cliente.goto(link);
    await expect(cliente).toHaveURL(`${app}/ajuda/atendimento/${c.id}`);
    await expect(cliente.getByRole('heading', { name: c.assunto })).toBeVisible();
    const arquivos = exigir(
      await db
        .from('suporte_arquivos')
        .select('id,suporte_mensagens!inner(atendimento)')
        .eq('suporte_mensagens.atendimento', c.id),
    );
    for (const arquivo of arquivos) {
      const download = `${app}/api/suporte/anexos/${arquivo.id}?atendimento=${c.id}`;
      assert.equal((await contextoCliente.request.get(download)).status(), 200);
      assert.equal((await fetch(download)).status, 404);
    }
    if (arquivos.length)
      console.log('Anexo recebido por e-mail: download autorizado e acesso anônimo bloqueado.');
    await page.goto(`${app}/suporte/equipe/${c.id}`);
    await expect(page.getByRole('heading', { name: c.assunto })).toBeVisible();
    if (process.argv.includes('--verificar-acabamento')) {
      await expect(cliente.getByText('Recebida por e-mail', { exact: true }).first()).toBeVisible();
      await expect(cliente.getByText('QA Atendimento', { exact: true }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: 'Assumir atendimento' })).toHaveCount(0);
      await page.evaluate(() => globalThis.window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.screenshot({ path: `${pasta}/equipe-final-${c.numero}.png`, fullPage: true });
      await cliente.screenshot({ path: `${pasta}/cliente-final-${c.numero}.png`, fullPage: true });
      console.log('Acabamento publicado: autor, origem do e-mail e atribuição conferidos.');
    }
    if (modo === 'encerrar') {
      const jaEnviada = exigir(
        await db
          .from('suporte_mensagens')
          .select('id')
          .eq('atendimento', c.id)
          .like('texto', 'FECHAMENTO-QA-%'),
      );
      if (!jaEnviada.length) {
        await page
          .getByRole('textbox', { name: /Sua mensagem|Precisa de mais ajuda/ })
          .fill(
            `FECHAMENTO-QA-${c.numero}: recebemos sua resposta no mesmo atendimento. O teste terminou corretamente e o pedido foi resolvido. Obrigado!`,
          );
        await page.getByLabel('Depois de responder').selectOption('resolvido');
        await page.getByRole('button', { name: 'Enviar mensagem', exact: true }).click();
        await expect(page.getByRole('status')).toContainText('Mensagem enviada.');
      }
      await contextoCliente.close();
      console.log(JSON.stringify({ numero: c.numero, encerramentoEnviado: true }));
      continue;
    }
    const antes = exigir(
      await db.from('suporte_notificacoes').select('id').eq('atendimento', c.id),
    );
    const nota = 'NOTA-PRIVADA-QA: nunca deve aparecer para o cliente ou no e-mail.';
    const existentes = exigir(
      await db.from('suporte_mensagens').select('texto').eq('atendimento', c.id),
    );
    if (!existentes.some((m) => m.texto === nota)) {
      await page.getByRole('button', { name: 'Nota interna', exact: true }).click();
      await page.getByLabel('Nota interna', { exact: true }).fill(nota);
      await page.getByRole('button', { name: 'Salvar nota', exact: true }).click();
      await expect(page.getByRole('status')).toContainText('Nota interna salva.');
      assert.equal(
        exigir(await db.from('suporte_notificacoes').select('id').eq('atendimento', c.id)).length,
        antes.length,
      );
    }
    await page.getByRole('button', { name: 'Responder ao cliente', exact: true }).click();
    if (c.email === permitidos[0]) {
      await page.getByRole('button', { name: 'Preparar sugestão com IA' }).click();
      const sugestao = page.getByRole('region', { name: 'Sugestão da IA' });
      await expect(sugestao).toBeVisible({ timeout: 90_000 });
      await expect(sugestao).not.toContainText('NOTA-PRIVADA-QA');
      await sugestao.getByRole('button', { name: 'Descartar' }).click();
      console.log('Sugestão real de IA revisável; nota interna não reproduzida.');
    }
    if (!existentes.some((m) => m.texto.includes('RESPOSTA-QA-'))) {
      await page
        .getByRole('textbox', { name: /Sua mensagem|Precisa de mais ajuda/ })
        .fill(
          `RESPOSTA-QA-${c.numero}: A conversa chegou corretamente. Responda a este e-mail para confirmar que a resposta volta ao mesmo atendimento. Este é um teste controlado da central de ajuda.`,
        );
      await page.getByLabel('Depois de responder').selectOption('resolvido');
      await page.getByRole('button', { name: 'Enviar mensagem', exact: true }).click();
      await expect(page.getByRole('status')).toContainText('Mensagem enviada.');
    }
    await cliente.reload();
    await expect(cliente.getByText(nota, { exact: true })).toHaveCount(0);
    await expect(cliente.getByText(new RegExp(`RESPOSTA-QA-${c.numero}:`))).toBeVisible();
    await cliente.screenshot({ path: `${pasta}/cliente-${c.numero}.png`, fullPage: true });
    await page.screenshot({ path: `${pasta}/equipe-${c.numero}.png`, fullPage: true });
    console.log(
      JSON.stringify({
        numero: c.numero,
        confirmacaoReal: true,
        respostaPelaInterface: true,
        notaPrivada: true,
        esperandoReplica: true,
      }),
    );
    await contextoCliente.close();
  }
} finally {
  await browser.close();
}
