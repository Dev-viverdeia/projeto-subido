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
