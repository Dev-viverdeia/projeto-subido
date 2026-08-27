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
