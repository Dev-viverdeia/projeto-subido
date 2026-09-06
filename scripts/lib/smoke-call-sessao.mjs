import { createServerClient } from '@supabase/ssr';

export async function cookiesDaSessao({ supabaseUrl, anonKey, appUrl, email, password, erroSe }) {
  const cookies = [];
  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll: () => cookies,
      setAll: (novos) => {
        for (const novo of novos) {
          const indice = cookies.findIndex((item) => item.name === novo.name);
          if (indice >= 0) cookies[indice] = novo;
          else cookies.push(novo);
        }
      },
    },
  });
  const login = await supabase.auth.signInWithPassword({ email, password });
  erroSe(login.error, 'autenticar navegador');
  return cookies.map(({ name, value }) => ({ name, value, url: appUrl }));
}

export function observarPagina(page, papel, eventos) {
  page.on('pageerror', (erro) => eventos.push(`${papel}:pageerror:${erro.message}`));
  page.on('response', (response) => {
    const url = new URL(response.url());
    if (!url.pathname.startsWith('/api/calls/')) return;
    eventos.push(`${papel}:${response.request().method()}:${url.pathname}:${response.status()}`);
  });
}

export async function validarTranscricaoVisivel({ paginaHost, eventos, esperar }) {
  try {
    const ultimaFala = paginaHost
      .locator('section')
      .filter({ has: paginaHost.getByText('Última fala', { exact: true }) })
      .locator('p');
    await esperar({
      contexto: 'aguardar fala transcrita na tela',
      limiteMs: 70_000,
      intervaloMs: 500,
      ler: () => ultimaFala.innerText().catch(() => ''),
      pronto: (texto) => texto.trim().length > 20 && !texto.startsWith('Aguardando'),
    });
  } catch {
    await paginaHost.screenshot({
      path: '/private/tmp/subido-call-smoke-sem-transcricao.png',
      fullPage: true,
    });
    throw new Error(
      `A transcrição não apareceu. APIs: ${JSON.stringify(eventos)}. Tela: ${(await paginaHost.locator('body').innerText()).slice(0, 2_000)}`,
    );
  }
}

export async function removerCenarioCall({ admin, teste, erroSe }) {
  const gravacoes = teste.reuniao
    ? await admin
        .from('calls_gravacoes')
        .select('caminho_arquivo')
        .eq('dono', teste.usuario)
        .eq('reuniao_id', teste.reuniao)
    : { data: [], error: null };
  erroSe(gravacoes.error, 'localizar gravações de teste');
  const caminhos = (gravacoes.data ?? [])
    .map((gravacao) => gravacao.caminho_arquivo)
    .filter(Boolean);
  if (caminhos.some((caminho) => !caminho.startsWith(`${teste.usuario}/${teste.reuniao}/`))) {
    throw new Error('A gravação não pertence à reunião descartável. Limpeza interrompida.');
  }
  if (caminhos.length) {
    const remocao = await admin.storage.from('call-gravacoes').remove(caminhos);
    erroSe(remocao.error, 'remover gravações de teste');
  }
  const exclusao = await admin.auth.admin.deleteUser(teste.usuario);
  erroSe(exclusao.error, 'remover conta descartável');
}
