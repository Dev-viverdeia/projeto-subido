import { lerPaginaPublica } from './site.ts';

const url = new URL('https://empresa.example.test');
function exigir(valor: unknown, mensagem: string) {
  if (!valor) throw new Error(mensagem);
}
async function simular(responder: typeof fetch, executar: () => Promise<void>) {
  const original = globalThis.fetch;
  const dns = Deno.resolveDns;
  globalThis.fetch = responder;
  Deno.resolveDns = (() => Promise.resolve(['93.184.216.34'])) as unknown as typeof Deno.resolveDns;
  try {
    await executar();
  } finally {
    globalThis.fetch = original;
    Deno.resolveDns = dns;
  }
}
async function recusar(erro: string) {
  try {
    await lerPaginaPublica(url);
  } catch (e) {
    exigir(e instanceof Error && e.message === erro, `Erro inesperado: ${e}`);
    return;
  }
  throw new Error('Deveria recusar');
}
Deno.test('site: HTML legítimo e UTF-8 dividido entre chunks', async () => {
  const bytes = new TextEncoder().encode(
    '<title>Clínica</title><p>' + 'Informação útil. '.repeat(30) + '</p>',
  );
  const corpo = new ReadableStream({
    start(c) {
      for (let i = 0; i < bytes.length; i += 3) c.enqueue(bytes.slice(i, i + 3));
      c.close();
    },
  });
  await simular(
    () => Promise.resolve(new Response(corpo, { headers: { 'content-type': 'text/html' } })),
    async () => {
      const p = await lerPaginaPublica(url);
      exigir(p.titulo === 'Clínica' && p.texto.includes('Informação útil.'), 'UTF-8 corrompido');
    },
  );
});
for (const tamanhoDeclarado of [undefined, '1']) {
  Deno.test(`site: cancela corpo acima de 500k, content-length=${tamanhoDeclarado}`, async () => {
    let cancelado = false;
    const corpo = new ReadableStream({
      pull(c) {
        c.enqueue(new Uint8Array(100_001));
      },
      cancel() {
        cancelado = true;
      },
    });
    await simular(
      () =>
        Promise.resolve(
          new Response(corpo, {
            headers: {
              'content-type': 'text/plain',
              ...(tamanhoDeclarado ? { 'content-length': tamanhoDeclarado } : {}),
            },
          }),
        ),
      () => recusar('site_muito_grande'),
    );
    exigir(cancelado, 'Não cancelou leitura excessiva');
  });
}
Deno.test('site: timeout continua ativo depois dos headers', async () => {
  let cancelado = false;
  const corpo = new ReadableStream({
    cancel() {
      cancelado = true;
    },
  });
  await simular(
    () => Promise.resolve(new Response(corpo, { headers: { 'content-type': 'text/plain' } })),
    () => recusar('site_tempo_esgotado'),
  );
  exigir(cancelado, 'Corpo travado não foi cancelado');
});
Deno.test('site: limite em bytes, inclusive texto multibyte', async () => {
  await simular(
    () =>
      Promise.resolve(
        new Response('á'.repeat(250001), { headers: { 'content-type': 'text/plain' } }),
      ),
    () => recusar('site_muito_grande'),
  );
  await simular(
    () =>
      Promise.resolve(
        new Response('a'.repeat(500000), { headers: { 'content-type': 'text/plain' } }),
      ),
    async () => {
      exigir((await lerPaginaPublica(url)).texto.length === 14000, 'Limite exato deveria passar');
    },
  );
});
Deno.test('site: redirect cancela corpo e revalida destino', async () => {
  let cancelado = false;
  await simular(
    () =>
      Promise.resolve(
        new Response(
          new ReadableStream({
            cancel() {
              cancelado = true;
            },
          }),
          {
            status: 302,
            headers: { location: 'http://localhost/secreto' },
          },
        ),
      ),
    () => recusar('site_nao_permitido'),
  );
  exigir(cancelado, 'Corpo do redirect não cancelado');
});
Deno.test('site: falhas HTTP e MIME não deixam corpo aberto', async () => {
  for (const [status, tipo, erro] of [
    [500, 'text/plain', 'site_http_500'],
    [200, 'image/png', 'site_formato_invalido'],
  ] as const) {
    let cancelado = false;
    await simular(
      () =>
        Promise.resolve(
          new Response(
            new ReadableStream({
              cancel() {
                cancelado = true;
              },
            }),
            {
              status,
              headers: { 'content-type': tipo },
            },
          ),
        ),
      () => recusar(erro),
    );
    exigir(cancelado, 'Corpo recusado não cancelado');
  }
});
Deno.test('site: HTML malformado não bloqueia o event loop em regex quadrático', async () => {
  for (const html of [
    '<'.repeat(500000),
    '<script>'.repeat(62500),
    '<title>'.repeat(71428),
    '<!--'.repeat(125000),
  ]) {
    const inicio = performance.now();
    await simular(
      () => Promise.resolve(new Response(html, { headers: { 'content-type': 'text/html' } })),
      () => recusar('site_sem_conteudo'),
    );
    exigir(performance.now() - inicio < 1000, 'Parser não foi linear dentro do teto de 500k');
  }
});
Deno.test('site: não inclui código, comentários ou estilos no texto do lead', async () => {
  const html =
    '<title>Empresa</title><script>segredo-script</script><style>segredo-style</style><!--segredo-comment--><svg>segredo-svg</svg><p>' +
    'Serviços públicos úteis. '.repeat(20) +
    '</p>';
  await simular(
    () => Promise.resolve(new Response(html, { headers: { 'content-type': 'text/html' } })),
    async () => {
      const p = await lerPaginaPublica(url);
      exigir(!p.texto.includes('segredo'), 'Vazou conteúdo não textual');
      exigir(p.texto.includes('Serviços públicos úteis.'), 'Perdeu texto legítimo');
    },
  );
});
