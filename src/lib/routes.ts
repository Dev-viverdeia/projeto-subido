/**
 * Fonte da verdade das rotas.
 *
 * Existe para que a navegação, os redirects e o matcher do proxy não divirjam. O
 * matcher é o caso especial — leia o aviso em `src/proxy.ts` antes de mexer nele.
 */

/** Rotas autenticadas — app e ativação. Toda rota daqui É coberta pelo proxy. */
export const ROTAS_APP = [
  '/boas-vindas',
  '/inicio',
  '/prospeccao',
  '/vendas',
  '/propostas',
  '/reunioes',
  '/solucoes',
  '/formacoes',
  '/builder',
  '/consultor',
  '/mentorias',
  '/certificados',
  '/conta',
  /* Área administrativa. Entra aqui — e não numa lista separada — porque para o
     proxy ela é igual às outras: exige sessão. Quem tem sessão mas não é admin é
     barrado depois, no layout de /admin, onde dá para consultar o papel. O proxy
     roda antes de qualquer consulta ao banco e não tem como saber isso. */
  '/admin',
] as const;

export type RotaApp = (typeof ROTAS_APP)[number];

/**
 * Nome de cada seção, em um lugar só.
 *
 * Mora aqui — e não em `navegacao.tsx`, junto dos itens de menu — porque o
 * cabeçalho precisa do rótulo e é Client Component (usa `usePathname`). Importar
 * `navegacao.tsx` de lá arrastaria o `lucide-react` inteiro para o bundle do
 * browser, já que aquele módulo carrega os ícones como JSX. Strings puras
 * atravessam a fronteira sem custo.
 *
 * `Record<RotaApp, string>` é o que garante a cobertura: acrescentar uma rota em
 * ROTAS_APP sem dar nome a ela vira erro de tipo, não um cabeçalho vazio.
 */
export const ROTULOS: Record<RotaApp, string> = {
  '/boas-vindas': 'Boas-vindas',
  '/inicio': 'Início',
  '/prospeccao': 'Prospecção',
  '/vendas': 'Vendas',
  '/propostas': 'Propostas',
  '/reunioes': 'Reuniões',
  '/solucoes': 'Projetos',
  '/formacoes': 'Formações',
  '/builder': 'Estúdio',
  '/consultor': 'Sobral AI',
  '/mentorias': 'Mentorias',
  '/certificados': 'Certificados',
  '/conta': 'Conta',
  '/admin': 'Administração',
};

/**
 * Rótulo da seção a que um caminho pertence.
 *
 * Por prefixo, para que `/solucoes/automacao-de-atendimento` continue dizendo
 * "Projetos" — a mesma regra que acende o item na navegação. A barra no fim evita
 * que `/conta` case com um futuro `/contas`.
 */
export function rotuloDaRota(caminho: string): string | null {
  const rota = ROTAS_APP.find((r) => caminho === r || caminho.startsWith(`${r}/`));
  return rota ? ROTULOS[rota] : null;
}

/** Rotas do grupo `(auth)` — públicas, mas redirecionam quem já tem sessão. */
export const ROTA_ENTRAR = '/entrar';
export const ROTA_CRIAR_CONTA = '/criar-conta';
export const ROTA_RECUPERAR_SENHA = '/recuperar-senha';
export const ROTA_NOVA_SENHA = '/nova-senha';
export const ROTA_CALLBACK = '/auth/callback';

/** Para onde vai quem acabou de entrar e não pediu nada específico. */
export const ROTA_POS_LOGIN: RotaApp = '/inicio';

/** Nome do parâmetro que carrega o destino pretendido através do login. */
export const PARAM_PROXIMO = 'proximo';

/**
 * Valida o destino de pós-login.
 *
 * Um `?proximo=` que chega pela URL é entrada de usuário, e entrada de usuário que
 * vira `redirect()` é um open redirect: `?proximo=https://phishing.exemplo` faria a
 * NOSSA tela de login despachar a pessoa autenticada para o site de outro. É a
 * mesma classe de falha do `returnUrl` que já rendeu CVE em vários produtos.
 *
 * A regra aqui é allowlist, não sanitização: o valor precisa ser exatamente uma das
 * rotas conhecidas (ou um filho dela). Qualquer outra coisa — URL absoluta, `//host`,
 * `/\host`, path desconhecido — cai no destino padrão.
 */
export function destinoSeguro(valor: string | null | undefined): string {
  if (!valor || !valor.startsWith('/')) return ROTA_POS_LOGIN;

  /* `//evil.com` e `/\evil.com` são tratados como protocol-relative pelos browsers
     e escapariam de um teste que só olhasse o primeiro caractere. */
  if (valor.startsWith('//') || valor.startsWith('/\\')) return ROTA_POS_LOGIN;

  const destinoAtual = valor
    .replace(/^\/crm(?=\/|\?|$)/, '/vendas')
    .replace(/^\/calls(?=\/|\?|$)/, '/reunioes');
  const caminho = destinoAtual.split('?')[0] ?? destinoAtual;
  const permitida = ROTAS_APP.some((rota) => caminho === rota || caminho.startsWith(`${rota}/`));

  return permitida ? destinoAtual : ROTA_POS_LOGIN;
}
