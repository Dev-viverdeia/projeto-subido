import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { contatosDoSite } from './enriquecer-site';

describe('extração de contatos públicos do site', () => {
  it('prioriza links explícitos e deduplica suas variantes', () => {
    const contatos = contatosDoSite('Telefone: (48) 99628-1475. Escreva: CONTATO@EMPRESA.COM.BR', [
      'tel:%2B5548996281475;ext=2',
      'https://wa.me/5548996281475/',
      'https://api.whatsapp.com/send?phone=5548996281475',
      'mailto:contato@empresa.com.br?subject=Olá',
    ]);
    expect(contatos.telefones).toEqual(['+5548996281475']);
    expect(contatos.emails).toEqual(['contato@empresa.com.br']);
  });
  it('não transforma IDs, assets, documentos ou scripts em telefones', () => {
    const contatos = contatosDoSite(
      'ID 48996281475 | https://empresa.test/48996281475.png | CPF 529.982.247-25 | CNPJ 12.345.678/0001-90 | <img data-id="(48) 99628-1475" /> <script>const tel = "(48) 99628-1475";</script> z48996281475',
      [],
    );
    expect(contatos.telefones).toEqual([]);
  });
  it('não recorta números maiores e rejeita domínios parecidos com WhatsApp', () => {
    expect(
      contatosDoSite('Telefone: 55489962814759999 | 999999999999999 | (48) 89999-1111', [
        'https://evilwhatsapp.com/send?phone=5548996281475',
        'https://wa.me.evil.test/5548996281475',
        'javascript:tel:+5548996281475',
      ]).telefones,
    ).toEqual([]);
  });
  it('aceita números rotulados, telefones formatados e centrais', () => {
    expect(
      contatosDoSite(
        'WhatsApp: 48996281475\nFale com a equipe (48) 3028-9989. Central 0800 123 4567 ou 4004-1234',
        [],
      ).telefones,
    ).toEqual(['(48) 3028-9989', '0800 123 4567', '4004-1234', '48996281475']);
  });
  it('preserva um telefone internacional em link explícito', () => {
    expect(contatosDoSite('', ['tel:+1-212-555-0123']).telefones).toEqual(['+1-212-555-0123']);
    expect(
      contatosDoSite('', [
        'https://wa.me/12125550123',
        'https://api.whatsapp.com/send?phone=12125550123',
      ]).telefones,
    ).toEqual(['+12125550123']);
  });
});
