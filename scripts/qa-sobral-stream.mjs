/** QA opt-in. Contas sintéticas; --com-ia faz duas gerações curtas reais. */
/* global document, innerWidth */
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

if (!process.argv.includes('--confirmar-teste')) throw new Error('Use --confirmar-teste.');
const app = process.env.SUBIDO_APP_URL || 'http://127.0.0.1:3113';
if (!['localhost', '127.0.0.1', 'subido.viverdeia.ai'].includes(new URL(app).hostname))
  throw new Error('Destino inválido.');
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const cookies = new Map();
const client = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  {
    cookies: {
      getAll: () => [...cookies.values()],
      setAll: (itens) => itens.forEach((c) => cookies.set(c.name, c)),
    },
  },
);
const exigir = (r) => {
  if (r.error) throw new Error(`QA: ${r.error.code}: ${r.error.message}`);
  return r.data;
};
const pasta = await mkdtemp(join(tmpdir(), 'subido-stream-'));
const resultado = { app, pasta, checks: [] };
const usuarios = [];
let browser;
try {
  const password = randomBytes(24).toString('base64url');
  async function criarUsuario(nome) {
    const email = `qa-stream-${Date.now()}-${nome}@example.invalid`;
    const id = exigir(
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          nome: 'QA Sobral',
          introducao_subido_concluida_em: new Date().toISOString(),
        },
        app_metadata: { plano_subido: 'pro', qa_stream: true },
      }),
    ).user.id;
    usuarios.push(id);
    return { id, email };
  }
  const usuario = await criarUsuario('dono');
  const outro = await criarUsuario('isolamento');
  exigir(await client.auth.signInWithPassword({ email: usuario.email, password }));
  const alheio = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  exigir(await alheio.auth.signInWithPassword({ email: outro.email, password }));
  const thread = exigir(
    await client
      .from('consultor_threads')
      .insert({ dono: usuario.id, titulo: 'QA concorrência' })
      .select('id')
      .single(),
  ).id;
  const pergunta = exigir(
    await client
      .from('consultor_mensagens')
      .insert({ thread_id: thread, papel: 'usuario', conteudo: 'Pergunta sintética de QA.' })
      .select('id')
      .single(),
  ).id;
  const iniciar = (tentativa, repetir = false) =>
    admin.rpc('sobral_iniciar_geracao', {
      p_dono: usuario.id,
      p_thread: thread,
      p_mensagem: pergunta,
      p_tentativa: tentativa,
      p_repetir: repetir,
    });
  const concorrentes = await Promise.all(Array.from({ length: 10 }, () => iniciar(randomUUID())));
  const ativos = concorrentes.map(exigir).filter((r) => r.executar);
  expect(ativos).toHaveLength(1);
  const tentativa = ativos[0].geracao.tentativa;
  expect(
    (
      await client.from('consultor_mensagens').insert({
        thread_id: thread,
        papel: 'usuario',
        conteudo: 'Outra aba tentou atravessar a resposta.',
      })
    ).error?.code,
  ).toBe('55000');
  resultado.checks.push('pergunta de outra aba bloqueada durante a resposta');
  expect(exigir(await alheio.from('sobral_geracoes').select('*'))).toHaveLength(0);
  expect(
    (await client.from('sobral_geracoes').update({ texto: 'forjado' }).eq('mensagem_id', pergunta))
      .error,
  ).toBeTruthy();
  expect(
    (
      await alheio.rpc('sobral_iniciar_geracao', {
        p_dono: usuario.id,
        p_thread: thread,
        p_mensagem: pergunta,
        p_tentativa: randomUUID(),
        p_repetir: true,
      })
    ).error,
  ).toBeTruthy();
  const finalizar = {
    p_dono: usuario.id,
    p_mensagem: pergunta,
    p_tentativa: tentativa,
    p_estado: 'concluida',
    p_dados: {
      texto: 'Resposta de teste sem chamada ao modelo.',
      tokens: 123,
      modelo: 'qa-sintetico',
    },
  };
  const finais = await Promise.all([
    admin.rpc('sobral_finalizar_geracao', finalizar),
    admin.rpc('sobral_finalizar_geracao', finalizar),
  ]);
  expect(new Set(finais.map(exigir).map((r) => r.resposta_id)).size).toBe(1);
  expect(
    exigir(await admin.from('consultor_uso').select('tokens').eq('dono', usuario.id).single())
      .tokens,
  ).toBe(123);
  expect(exigir(await iniciar(randomUUID(), true)).executar).toBe(false);
  expect(
    exigir(
      await client
        .from('consultor_mensagens')
        .select('id')
        .eq('thread_id', thread)
        .eq('papel', 'consultor'),
    ),
  ).toHaveLength(1);
  resultado.checks.push(
    '10 inícios concorrentes: 1 geração',
    'confirmação repetida: 1 resposta e 1 consumo',
    'RLS e funções restritas ao servidor',
  );
  const pergunta2 = exigir(
    await client
      .from('consultor_mensagens')
      .insert({ thread_id: thread, papel: 'usuario', conteudo: 'Segunda pergunta sintética.' })
      .select('id')
      .single(),
  ).id;
  const args2 = {
    p_dono: usuario.id,
    p_thread: thread,
    p_mensagem: pergunta2,
    p_tentativa: randomUUID(),
    p_repetir: false,
  };
  exigir(await admin.rpc('sobral_iniciar_geracao', args2));
  exigir(
    await admin
      .from('sobral_geracoes')
      .update({ parar_em: new Date().toISOString() })
      .eq('mensagem_id', pergunta2),
  );
  const parado = exigir(
    await admin.rpc('sobral_finalizar_geracao', {
      ...finalizar,
      p_mensagem: pergunta2,
      p_tentativa: args2.p_tentativa,
      p_dados: { texto: 'Trecho parcial preservado.', tokens: 37 },
    }),
  );
  expect(parado.estado).toBe('interrompida');
  expect(parado.resposta_id).toBeNull();
  expect(
    exigir(await admin.rpc('sobral_iniciar_geracao', { ...args2, p_tentativa: randomUUID() }))
      .executar,
  ).toBe(false);
  const novaTentativa = randomUUID();
  expect(
    exigir(
      await admin.rpc('sobral_iniciar_geracao', {
        ...args2,
        p_tentativa: novaTentativa,
        p_repetir: true,
      }),
    ).executar,
  ).toBe(true);
  expect(
    (
      await admin.rpc('sobral_finalizar_geracao', {
        ...finalizar,
        p_mensagem: pergunta2,
        p_tentativa: args2.p_tentativa,
      })
    ).error,
  ).toBeTruthy();
  exigir(
    await admin.rpc('sobral_finalizar_geracao', {
      ...finalizar,
      p_mensagem: pergunta2,
      p_tentativa: novaTentativa,
      p_estado: 'falhou',
      p_dados: { texto: '', tokens: 0 },
    }),
  );
  resultado.checks.push(
    'Parar vence conclusão concorrente',
    'recarga não reinicia resposta interrompida',
    'tentativa antiga não encerra tentativa nova',
  );
  exigir(await admin.from('consultor_threads').delete().eq('id', thread).eq('dono', usuario.id));

  if (process.argv.includes('--com-ia')) {
    browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: 'reduce',
    });
    await context.addCookies(
      [...cookies.values()].map(({ name, value }) => ({
        name,
        value,
        domain: new URL(app).hostname,
        path: '/',
        secure: app.startsWith('https:'),
        sameSite: 'Lax',
      })),
    );
    const page = await context.newPage();
    page.setDefaultTimeout(160000);
    const erros = [];
    page.on('pageerror', (e) => erros.push(e.message));
    const pedidos = [];
    page.on('request', (r) => {
      if (r.url().endsWith('/api/consultor/responder') && r.method() === 'POST')
        pedidos.push(r.postDataJSON());
    });
    await page.goto(`${app}/consultor`, { waitUntil: 'networkidle' });
    await page
      .getByRole('textbox')
      .fill(
        'Quero vender um projeto de IA para uma clínica com 120 atendimentos por dia e muitas faltas. Qual pergunta devo fazer primeiro? Responda em dois parágrafos curtos.',
      );
    const inicio = Date.now();
    await page.getByRole('button', { name: 'Enviar mensagem', exact: true }).click();
    await expect(page.locator('[data-resposta-progressiva][data-gerando="true"]')).toBeVisible();
    resultado.primeiroTextoMs = Date.now() - inicio;
    await page.screenshot({ path: join(pasta, 'desktop-respondendo.png'), fullPage: true });
    const pedido = pedidos[0];
    const repetido = await context.request.post(`${app}/api/consultor/responder`, { data: pedido });
    expect([200, 202]).toContain(repetido.status());
    expect((await repetido.json()).geracao.tentativa).toBe(pedido.tentativa);
    await expect
      .poll(
        async () =>
          exigir(
            await admin
              .from('sobral_geracoes')
              .select('estado')
              .eq('mensagem_id', pedido.mensagem_id)
              .single(),
          ).estado,
        { timeout: 170000 },
      )
      .toBe('concluida');
    await page.waitForURL(`**/consultor/${pedido.thread_id}`);
    const completo = exigir(
      await admin
        .from('sobral_geracoes')
        .select('*')
        .eq('mensagem_id', pedido.mensagem_id)
        .single(),
    );
    expect(completo.tokens).toBeGreaterThan(0);
    expect(
      exigir(
        await client
          .from('consultor_mensagens')
          .select('id')
          .eq('thread_id', pedido.thread_id)
          .eq('papel', 'consultor'),
      ),
    ).toHaveLength(1);
    resultado.checks.push(
      'texto real aparece antes do fim',
      'repetir pedido não duplica resposta',
      'resposta e uso confirmados no banco',
    );
    await page.screenshot({ path: join(pasta, 'desktop-concluido.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page
      .getByRole('textbox')
      .fill(
        'Agora detalhe um diagnóstico completo para a clínica, com perguntas sobre agenda, atendimento, integrações, prioridades e métricas.',
      );
    await page.getByRole('button', { name: 'Enviar mensagem', exact: true }).click();
    await expect(page.locator('[data-resposta-progressiva]')).toBeVisible();
    await page.getByRole('button', { name: 'Parar resposta', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Gerar novamente', exact: true })).toBeVisible();
    const pedido2 = pedidos.at(-1);
    const interrompida = exigir(
      await admin
        .from('sobral_geracoes')
        .select('*')
        .eq('mensagem_id', pedido2.mensagem_id)
        .single(),
    );
    expect(interrompida.estado).toBe('interrompida');
    expect(interrompida.resposta_id).toBeNull();
    expect(interrompida.texto.length).toBeGreaterThan(0);
    const compositor = await page.locator('form').boundingBox();
    expect(compositor.y + compositor.height).toBeLessThan(775);
    const leitura = await page.locator('[data-leitura-conversa]').boundingBox();
    expect(leitura.y + leitura.height).toBeLessThanOrEqual(compositor.y);
    await page.screenshot({ path: join(pasta, 'mobile-interrompida.png'), fullPage: true });
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByRole('button', { name: 'Gerar novamente', exact: true })).toBeVisible();
    expect(
      exigir(
        await admin
          .from('sobral_geracoes')
          .select('tentativa')
          .eq('mensagem_id', pedido2.mensagem_id)
          .single(),
      ).tentativa,
    ).toBe(interrompida.tentativa);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(
      false,
    );
    const axe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    resultado.acessibilidade = axe.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.length,
    }));
    expect(resultado.acessibilidade).toEqual([]);
    expect(erros).toEqual([]);
    resultado.checks.push(
      'Parar real interrompe e preserva texto',
      'recarga mantém parcial e tentativa',
      'mobile sem overflow',
      'WCAG AA sem violações',
      'sem erros JavaScript',
    );
    resultado.usoParada = interrompida.tokens;
    const anonimo = await browser.newContext();
    expect(
      (
        await anonimo.request.get(
          `${app}/api/consultor/responder?mensagem_id=${pedido.mensagem_id}`,
        )
      ).status(),
    ).toBe(401);
    await anonimo.close();
  }
} finally {
  await browser?.close();
  for (const id of usuarios) exigir(await admin.auth.admin.deleteUser(id));
  resultado.limpeza = 'contas QA removidas';
  await writeFile(join(pasta, 'resultado.json'), JSON.stringify(resultado, null, 2));
  console.log(JSON.stringify(resultado, null, 2));
}
