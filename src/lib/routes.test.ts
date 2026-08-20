import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROTAS_APP, ROTA_POS_LOGIN, destinoSeguro } from '@/lib/routes';

const fonteProxy = readFileSync(resolve(process.cwd(), 'src/proxy.ts'), 'utf8');
const blocoMatcher = fonteProxy.match(/matcher:\s*\[([\s\S]*?)\]/)?.[1] ?? '';
const matcher = [...blocoMatcher.matchAll(/['"]([^'"]+\/:path\*)['"]/g)].flatMap((resultado) =>
  resultado[1] ? [resultado[1]] : [],
);

/**
 * Este arquivo existe por causa de uma armadilha específica do Next 16:
 *
 *   "The matcher values need to be constants so they can be statically analyzed
 *    at build-time. Dynamic values such as variables will be ignored."
 *
 * IGNORADO — não é erro de build, não é warning. Se alguém "melhorar" o matcher de
 * `src/proxy.ts` para derivá-lo de `ROTAS_APP`, o proxy simplesmente para de rodar e
 * as rotas autenticadas ficam abertas, com o CI verde. A lista literal de lá é uma
 * duplicata obrigatória, e estes testes são o que impede a duplicata de divergir.
 */
describe('matcher do proxy', () => {
  it('cobre exatamente as rotas de (app), nem mais nem menos', () => {
    const doMatcher = matcher.map((p) => p.replace('/:path*', '')).sort();
    expect(doMatcher).toEqual([...ROTAS_APP].sort());
  });

  it('não cobre a landing — cada clique pago pagaria cold start de Node', () => {
    expect(matcher).not.toContain('/');
    /* Um padrão como '/(.*)' ou '/((?!_next).*)' pegaria `/` por dentro. */
    for (const padrao of matcher) {
      expect(padrao.startsWith('/(')).toBe(false);
    }
  });

  it('usa :path* para que a raiz de cada seção também case', () => {
    for (const padrao of matcher) {
      expect(padrao.endsWith('/:path*')).toBe(true);
    }
  });
});

describe('destinoSeguro', () => {
  it('aceita uma rota de app e seus filhos', () => {
    expect(destinoSeguro('/solucoes')).toBe('/solucoes');
    expect(destinoSeguro('/solucoes/automacao-de-atendimento')).toBe(
      '/solucoes/automacao-de-atendimento',
    );
  });

  it('leva links antigos para os nomes atuais', () => {
    expect(destinoSeguro('/crm/cliente-1?aba=resumo')).toBe('/vendas/cliente-1?aba=resumo');
    expect(destinoSeguro('/calls?nova=1')).toBe('/reunioes?nova=1');
  });

  it.each([
    ['https://phishing.exemplo', 'URL absoluta'],
    ['//phishing.exemplo', 'protocol-relative'],
    ['/\\phishing.exemplo', 'barra invertida — o browser trata como //'],
    ['/rota-que-nao-existe', 'path fora da allowlist'],
    ['', 'vazio'],
    [null, 'ausente'],
  ])('recusa %s (%s)', (entrada: string | null, _motivo: string) => {
    expect(destinoSeguro(entrada)).toBe(ROTA_POS_LOGIN);
  });
});
