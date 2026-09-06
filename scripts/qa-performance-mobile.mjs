/** Laboratório opt-in: conta descartável, sem IA, buscas pagas ou mensagens externas.
 * Execute contra next start; mantenha a mesma máquina/perfil nos dois ensaios.
 */
/* global window, document, innerWidth */
import { randomBytes } from 'node:crypto';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { chromium, expect } from '@playwright/test';

if (!process.argv.includes('--confirmar-teste')) throw new Error('Use --confirmar-teste.');
const app = process.env.SUBIDO_APP_URL || 'http://127.0.0.1:3114';
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
function exigir(resultado) {
  if (resultado.error) throw new Error(`QA: ${resultado.error.code || 'falha'}`);
  return resultado.data;
}
const pasta = await mkdtemp(join(tmpdir(), 'subido-performance-'));
const amostras = [];
let usuario;
let browser;
try {
  const email = `qa-performance-${Date.now()}@example.invalid`;
  const password = randomBytes(24).toString('base64url');
  usuario = exigir(
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nome: 'QA Mobile',
        introducao_subido_concluida_em: new Date().toISOString(),
      },
      app_metadata: { plano_subido: 'pro', qa_performance: true },
    }),
  ).user.id;
  exigir(await client.auth.signInWithPassword({ email, password }));
  const empresas = exigir(
    await client
      .from('crm_empresas')
      .insert(
        Array.from({ length: 30 }, (_, i) => ({
          dono: usuario,
          nome: `Empresa QA ${String(i + 1).padStart(2, '0')}`,
        })),
      )
      .select('id'),
  );
  exigir(
    await client.from('crm_oportunidades').insert(
      empresas.map((empresa, i) => ({
        dono: usuario,
        empresa_id: empresa.id,
        titulo: 'Atendimento com IA',
        etapa: ['novo_lead', 'descoberta', 'proposta'][i % 3],
      })),
    ),
  );
  const lista = exigir(
    await admin
      .from('prospeccao_listas')
      .insert({
        dono: usuario,
        nome: 'Lista QA',
        segmento: 'Clínicas QA',
        localizacao: 'Florianópolis',
        quantidade_solicitada: 20,
        creditos_reservados: 20,
        creditos_consumidos: 20,
        status: 'concluida',
      })
      .select('id')
      .single(),
  );
  exigir(
    await admin.from('prospeccao_leads').insert(
      Array.from({ length: 20 }, (_, i) => ({
        dono: usuario,
        lista_id: lista.id,
        nome: `Clínica QA ${i + 1}`,
        chave_externa: `qa-${usuario}-${i}`,
        cidade: 'Florianópolis',
        estado: 'SC',
        categoria: 'Clínica',
        telefone: '+55 48 3000-0000',
      })),
    ),
  );
  browser = await chromium.launch();
  for (const rota of ['/vendas', '/prospeccao', '/consultor']) {
    for (let rodada = 0; rodada < 3; rodada++) {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
        reducedMotion: 'reduce',
      });
      await context.addCookies(
        [...cookies.values()].map(({ name, value }) => ({
          name,
          value,
          domain: new URL(app).hostname,
          path: '/',
          secure: new URL(app).protocol === 'https:',
          sameSite: 'Lax',
        })),
      );
      const page = await context.newPage();
      page.setDefaultTimeout(90_000);
      const erros = [];
      page.on('pageerror', (erro) => erros.push(erro.message));
      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      await cdp.send('Network.emulateNetworkConditions', {
        offline: false,
        latency: 150,
        downloadThroughput: 200_000,
        uploadThroughput: 93_750,
        connectionType: 'cellular4g',
      });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await page.addInitScript(() => {
        window.__medicao = { lcp: 0, longTasks: 0, bloqueio: 0 };
        new PerformanceObserver((lista) =>
          lista.getEntries().forEach((e) => {
            window.__medicao.lcp = e.startTime;
          }),
        ).observe({ type: 'largest-contentful-paint', buffered: true });
        new PerformanceObserver((lista) =>
          lista.getEntries().forEach((e) => {
            window.__medicao.longTasks++;
            window.__medicao.bloqueio += Math.max(0, e.duration - 50);
          }),
        ).observe({ type: 'longtask', buffered: true });
      });
      await page.goto(`${app}${rota}`, { waitUntil: 'networkidle', timeout: 90_000 });
      // Verifica um controle hidratado, não apenas o HTML visível.
      if (rota === '/vendas') {
        await page.getByPlaceholder('Buscar empresa ou contato').fill('Empresa QA 01');
        await expect(page.getByText('1 venda', { exact: true })).toBeVisible();
      } else if (rota === '/prospeccao') {
        await page.getByRole('button', { name: '10', exact: true }).click();
        await expect(page.getByRole('button', { name: '10', exact: true })).toHaveAttribute(
          'aria-pressed',
          'true',
        );
      } else {
        await page.getByRole('button', { name: 'Priorizar uma venda' }).click();
        await expect(page.getByRole('textbox')).not.toHaveValue('');
      }
      const medida = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0];
        const scripts = performance
          .getEntriesByType('resource')
          .filter((r) => r.name.includes('/_next/') && r.name.split('?')[0].endsWith('.js'));
        return {
          ...window.__medicao,
          ttfb: nav.responseStart,
          jsBytes: scripts.reduce((s, r) => s + r.encodedBodySize, 0),
          scripts: scripts.length,
          horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
        };
      });
      const amostra = { rota, rodada: rodada + 1, ...medida, erros };
      amostras.push(amostra);
      console.log(JSON.stringify(amostra));
      if (erros.length || medida.horizontalOverflow) throw new Error('Regressão de UI no ensaio.');
      if (rodada === 0)
        await page.screenshot({ path: join(pasta, `${rota.slice(1)}.png`), fullPage: false });
      if (process.argv.includes('--validar-recuperacao') && rota === '/consultor' && rodada === 2) {
        // Registro real na conta de QA; interrompe ANTES da rota que chama a IA.
        let tentativas = 0;
        await page.route('**/api/consultor/responder', async (route) => {
          tentativas++;
          await route.abort('internetdisconnected');
        });
        await page.getByRole('textbox').fill('Mensagem de QA para validar a conexão.');
        await page.getByRole('button', { name: 'Enviar mensagem' }).click();
        const repetir = page.getByRole('button', { name: 'Tentar novamente', exact: true });
        await expect(repetir).toBeVisible({ timeout: 30_000 });
        await repetir.click();
        await expect.poll(() => tentativas).toBe(2);
        await expect(repetir).toBeVisible();
        const mensagens = exigir(await client.from('consultor_mensagens').select('id'));
        if (mensagens.length !== 1) throw new Error('A retomada duplicou a mensagem.');
        console.log(
          JSON.stringify({ recuperacaoSobral: true, mensagens: mensagens.length, chamadasIA: 0 }),
        );
      }
      await context.close();
    }
  }
  await writeFile(
    join(pasta, 'medicoes.json'),
    JSON.stringify(
      { perfil: '390x844, CPU 4x, 1.6 Mbps, RTT 150ms, cache frio, 3 amostras por rota', amostras },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ pasta, concluido: true }));
} finally {
  await browser?.close();
  if (usuario) exigir(await admin.auth.admin.deleteUser(usuario));
}
