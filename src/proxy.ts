import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

/**
 * Proxy — o que no Next 15 se chamava `middleware.ts`.
 *
 * Roda SÓ em Node. Não existe runtime edge no Next 16, então cada rota que este
 * matcher casar custa uma invocação de função — o que torna o matcher uma decisão
 * de custo, não de configuração.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

/**
 * ⚠ O MATCHER MAIS CARO DO PROJETO. Leia antes de editar.
 *
 * 1. ELE É UMA ALLOWLIST POSITIVA, DE PROPÓSITO.
 *    O matcher do quickstart do Supabase é o inverso — uma negativa que pega tudo
 *    menos assets estáticos. Copiado para cá, ele casaria `/`, a landing de tráfego
 *    pago, e cada clique de anúncio deixaria de ser um hit de CDN de ~40ms para
 *    virar um cold start de Node. A landing NÃO PODE aparecer nesta lista, nem por
 *    meio de um padrão que a inclua por acidente.
 *
 * 2. ESTAS STRINGS SÃO DUPLICATAS INTENCIONAIS DE `ROTAS_APP`.
 *    O Next analisa o matcher estaticamente em tempo de build: "matcher values need
 *    to be constants... dynamic values such as variables will be ignored"
 *    (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md).
 *    Um `...ROTAS_APP.map(...)` aqui não daria erro — seria IGNORADO em silêncio, e
 *    o proxy simplesmente pararia de proteger as rotas. Por isso a lista é literal,
 *    e por isso existe um teste que falha se ela divergir de `ROTAS_APP`.
 *
 * 3. AS ROTAS DE `(auth)` NÃO ENTRAM.
 *    Elas são públicas e quem já tem sessão é redirecionado pelo layout do grupo.
 *    Incluí-las aqui criaria um loop: o proxy manda o deslogado para `/entrar`, e
 *    `/entrar` dispara o proxy de novo.
 */
export const config = {
  matcher: [
    '/boas-vindas/:path*',
    '/inicio/:path*',
    '/prospeccao/:path*',
    '/vendas/:path*',
    '/metricas/:path*',
    '/propostas/:path*',
    '/reunioes/:path*',
    '/entregas/:path*',
    '/solucoes/:path*',
    '/formacoes/:path*',
    '/builder/:path*',
    '/consultor/:path*',
    '/mentorias/:path*',
    '/certificados/:path*',
    '/conta/:path*',
    '/admin/:path*',
  ],
};
