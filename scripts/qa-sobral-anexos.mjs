/** Opt-in: conta descartável; uploads reais e falhas de rede controladas.
 * --com-ia executa uma única rodada curta com áudio/documento sintéticos. */
/* global document, innerWidth */
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdtemp, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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
const exigir = (r) => {
  if (r.error) throw new Error(`QA: ${r.error.code || 'falha'} ${r.error.message}`);
  return r.data;
};
const pasta = await mkdtemp(join(tmpdir(), 'subido-anexos-'));
const resultado = { app, pasta, checks: [] };
function pdfDeTeste() {
  const texto =
    'BT /F1 14 Tf 40 740 Td (Clinica Aurora atende 120 pacientes por dia. Quer reduzir faltas.) Tj ET';
  const objetos = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${texto.length} >>\nstream\n${texto}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objetos.forEach((o, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((o) => `${String(o).padStart(10, '0')} 00000 n \n`)
    .join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
}
let usuario;
let outraConta;
let browser;
async function arquivosRecursivos(prefixo) {
  const itens = exigir(await admin.storage.from('sobral-anexos').list(prefixo, { limit: 100 }));
  for (const item of itens) {
    const caminho = `${prefixo}/${item.name}`;
    if (item.id) exigir(await admin.storage.from('sobral-anexos').remove([caminho]));
    else await arquivosRecursivos(caminho);
  }
}
try {
  const email = `qa-anexos-${Date.now()}@example.invalid`;
  const password = randomBytes(24).toString('base64url');
  usuario = exigir(
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nome: 'QA Anexos',
        introducao_subido_concluida_em: new Date().toISOString(),
      },
      app_metadata: { plano_subido: 'pro', qa_anexos: true },
    }),
  ).user.id;
  exigir(await client.auth.signInWithPassword({ email, password }));
  browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
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
      secure: app.startsWith('https:'),
      sameSite: 'Lax',
    })),
  );
  const page = await context.newPage();
  page.setDefaultTimeout(90_000);
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));
  let patches = 0;
  let commits = 0;
  const offsets = [];
  const recibos = [];
  await page.route('**/storage/v1/upload/resumable/**', async (route) => {
    if (route.request().method() === 'PATCH') {
      offsets.push(Number(route.request().headers()['upload-offset']));
      if (++patches === 1) {
        await route.abort('failed');
        return;
      }
    }
    await route.continue();
  });
  await page.route('**/rest/v1/rpc/sobral_confirmar_anexos', async (route) => {
    recibos.push(route.request().postDataJSON());
    const response = await route.fetch();
    if (++commits === 1 && response.ok()) await route.abort('failed');
    else await route.fulfill({ response });
  });
  await page.route('**/api/consultor/responder', (route) => route.abort('failed'));
  await page.goto(`${app}/consultor`, { waitUntil: 'networkidle' });
  // WAV PCM válido, gerado localmente; nunca inclui material de usuários reais.
  const wav = join(pasta, 'duvida.wav');
  execFileSync('/usr/bin/say', [
    '-v',
    'Luciana',
    '-o',
    join(pasta, 'duvida.aiff'),
    'Quero vender projetos de inteligência artificial para clínicas. Como preparo minha primeira reunião?',
  ]);
  execFileSync('/opt/homebrew/bin/ffmpeg', [
    '-v',
    'error',
    '-i',
    join(pasta, 'duvida.aiff'),
    '-ar',
    '16000',
    '-ac',
    '1',
    wav,
  ]);
  const audio = await readFile(wav);
  await page.locator('input[type=file]').setInputFiles([
    { name: 'duvida.wav', mimeType: 'audio/wav', buffer: audio },
    { name: 'contexto.txt', mimeType: 'text/plain', buffer: Buffer.alloc(7 * 1024 * 1024, 'A') },
  ]);
  await page.getByRole('textbox').fill('Teste de retomada de anexos.');
  await page.getByRole('button', { name: 'Enviar mensagem', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Retomar envio' })).toBeVisible();
  if (!patches) throw new Error('A interrupção TUS não foi exercitada.');
  await expect(page.getByText('100%', { exact: true })).toBeVisible();
  const antes = exigir(await client.from('consultor_mensagens').select('id'));
  if (antes.length) throw new Error('Mensagem parcial salva antes dos anexos.');
  await expect(page.getByText('O que precisa avançar?')).toBeHidden();
  const acessibilidade = await new AxeBuilder({ page }).analyze();
  resultado.acessibilidade = acessibilidade.violations.map((v) => ({
    id: v.id,
    impacto: v.impact,
    elementos: v.nodes.map((n) => n.target),
  }));
  if (acessibilidade.violations.some((v) => ['serious', 'critical'].includes(v.impact)))
    throw new Error('Regressão de acessibilidade.');
  await page.screenshot({ path: join(pasta, 'mobile-envio-pausado.png') });
  await page.getByRole('button', { name: 'Retomar envio' }).click();
  await expect(
    page.getByText('Falta confirmar o envio. Tente novamente sem reenviar os arquivos.'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Voltar à edição' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Retomar envio' }).click();
  await expect(page.getByRole('button', { name: 'Tentar novamente', exact: true })).toBeVisible();
  const mensagens = exigir(
    await client
      .from('consultor_mensagens')
      .select('id,thread_id,consultor_anexos(id,caminho_storage)'),
  );
  if (mensagens.length !== 1 || mensagens[0].consultor_anexos.length !== 2)
    throw new Error('Envio duplicado/incompleto.');
  if (JSON.stringify(recibos[0]) !== JSON.stringify(recibos[1]))
    throw new Error('Recibo mudou no retry.');
  resultado.checks.push(
    'retomada TUS após 6 MB',
    'primeiro anexo preservado',
    'mensagem atômica',
    'ACK perdido sem duplicação',
  );
  resultado.offsets = offsets;

  // Banco: repetição equivalente aceita; conteúdo diferente, arquivo inexistente
  // e associação com conversa alheia são negados sem criar linhas parciais.
  exigir(await client.rpc('sobral_confirmar_anexos', recibos[0]));
  for (const corpo of [
    { ...recibos[0], p_conteudo: 'outro conteúdo' },
    {
      ...recibos[0],
      p_mensagem: randomUUID(),
      p_anexos: [
        {
          ...recibos[0].p_anexos[0],
          id: randomUUID(),
          caminho_storage: `${usuario}/${randomUUID()}/nao-existe.txt`,
        },
      ],
    },
  ]) {
    if (!(await client.rpc('sobral_confirmar_anexos', corpo)).error)
      throw new Error('Conflito aceito indevidamente.');
  }
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false } },
  );
  if (!(await anon.rpc('sobral_confirmar_anexos', recibos[0])).error)
    throw new Error('Anônimo aceito.');
  resultado.checks.push('recibo divergente negado', 'arquivo ausente negado', 'anônimo negado');
  const emailOutro = `qa-anexos-outro-${Date.now()}@example.invalid`;
  outraConta = exigir(
    await admin.auth.admin.createUser({ email: emailOutro, password, email_confirm: true }),
  ).user.id;
  const outro = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  exigir(await outro.auth.signInWithPassword({ email: emailOutro, password }));
  if (!(await outro.rpc('sobral_confirmar_anexos', recibos[0])).error)
    throw new Error('Outra conta reutilizou o recibo.');
  if (exigir(await outro.from('consultor_anexos').select('id')).length)
    throw new Error('Outra conta leu os anexos.');
  const threadAlheia = randomUUID();
  exigir(
    await outro
      .from('consultor_threads')
      .insert({ id: threadAlheia, dono: outraConta, titulo: 'QA privado' }),
  );
  const caminhoProprio = `${usuario}/${threadAlheia}/${randomUUID()}.txt`;
  exigir(
    await client.storage
      .from('sobral-anexos')
      .upload(caminhoProprio, Buffer.from('abc'), { contentType: 'text/plain' }),
  );
  const cruzado = await client.rpc('sobral_confirmar_anexos', {
    ...recibos[0],
    p_thread: threadAlheia,
    p_mensagem: randomUUID(),
    p_anexos: [
      {
        id: randomUUID(),
        nome: 'abc.txt',
        tipo_mime: 'text/plain',
        tamanho_bytes: 3,
        categoria: 'documento',
        caminho_storage: caminhoProprio,
      },
    ],
  });
  if (!cruzado.error) throw new Error('Anexo entrou na conversa de outra conta.');
  resultado.checks.push('isolamento entre duas contas', 'conversa alheia negada');
  await page.goto(`${app}/consultor/${mensagens[0].thread_id}`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Reproduzir áudio' }).click();
  await expect.poll(() => page.locator('audio').evaluate((a) => a.currentTime)).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Pausar áudio' }).click();
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1))
    throw new Error('Overflow mobile.');
  await page.screenshot({ path: join(pasta, 'mobile-player-persistido.png'), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: join(pasta, 'desktop-player-persistido.png'), fullPage: true });
  resultado.checks.push('player persistido reproduz', 'mobile sem overflow');

  if (process.argv.includes('--com-ia')) {
    await page.unroute('**/api/consultor/responder');
    await page.unroute('**/rest/v1/rpc/sobral_confirmar_anexos');
    await page.goto(`${app}/consultor`, { waitUntil: 'networkidle' });
    await page.locator('input[type=file]').setInputFiles([
      { name: 'duvida.wav', mimeType: 'audio/wav', buffer: audio },
      {
        name: 'contexto-clinica.pdf',
        mimeType: 'application/pdf',
        buffer: pdfDeTeste(),
      },
    ]);
    await page
      .getByRole('textbox')
      .fill(
        'Responda à dúvida do áudio usando o documento. Cite o nome da clínica e o volume de atendimentos.',
      );
    const retorno = page.waitForResponse((r) => r.url().includes('/api/consultor/responder'), {
      timeout: 200_000,
    });
    await page.getByRole('button', { name: 'Enviar mensagem', exact: true }).click();
    const resposta = await retorno;
    const corpo = await resposta.json();
    if (!resposta.ok()) throw new Error(`IA: ${JSON.stringify(corpo)}`);
    if (!/Aurora/i.test(corpo.resposta) || !/120/.test(corpo.resposta))
      throw new Error('Resposta não usou os fatos do documento.');
    await expect(page.getByText('Ver transcrição', { exact: true })).toBeVisible({
      timeout: 90_000,
    });
    await page.getByText('Ver transcrição', { exact: true }).click();
    await expect(page.locator('details[open]')).toContainText(/clínicas/i);
    await page.screenshot({ path: join(pasta, 'desktop-audio-processado.png'), fullPage: true });
    resultado.checks.push('IA leu áudio e PDF', 'transcrição persistida e consultável');
  }
  if (erros.length) throw new Error(`JavaScript: ${erros.join('; ')}`);
  resultado.checks.push('sem erros JavaScript');
} finally {
  await browser?.close();
  if (usuario) {
    await arquivosRecursivos(usuario);
    exigir(await admin.auth.admin.deleteUser(usuario));
    resultado.limpeza = 'arquivos e conta QA removidos';
  }
  if (outraConta) exigir(await admin.auth.admin.deleteUser(outraConta));
  await writeFile(join(pasta, 'resultado.json'), JSON.stringify(resultado, null, 2));
  console.log(JSON.stringify(resultado, null, 2));
}
