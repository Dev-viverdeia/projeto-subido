import { assertEquals } from 'jsr:@std/assert@1';
import { extrairInteligenciaContato } from './gerar.ts';

Deno.test('site da ficha prevalece sobre o site importado', () => {
  const resultado = extrairInteligenciaContato({
    empresa: { dominio: 'novo.com.br', site_manual: true },
    prospeccao: { site_url: 'https://antigo.com.br' },
  });
  assertEquals(
    resultado.canais.filter((c) => c.tipo === 'site'),
    [{ tipo: 'site', valor: 'https://novo.com.br/', url: 'https://novo.com.br/', origem: 'crm' }],
  );
});

Deno.test('site removido manualmente não volta ao resultado do enriquecimento', () => {
  const resultado = extrairInteligenciaContato({
    empresa: { dominio: null, site_manual: true },
    prospeccao: { site_url: 'https://antigo.com.br' },
  });
  assertEquals(
    resultado.canais.filter((c) => c.tipo === 'site'),
    [],
  );
});

Deno.test('cadastro legado sem site ainda aceita a fonte da prospecção', () => {
  const resultado = extrairInteligenciaContato({
    empresa: { dominio: null },
    prospeccao: { site_url: 'https://antigo.com.br' },
  });
  assertEquals(
    resultado.canais.filter((c) => c.tipo === 'site').map((c) => c.origem),
    ['prospeccao'],
  );
});
