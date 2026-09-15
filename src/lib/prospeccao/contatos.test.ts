import { describe, expect, it } from 'vitest';
import { emailDe, emailsSemDuplicatas, telefoneDe, telefonesSemDuplicatas } from './contatos';

describe('contatos úteis, sem afirmar titularidade', () => {
  it.each(['+55 48 99628-1475', '5548996281475', '(48) 99628-1475', '048996281475'])(
    'normaliza o mesmo celular: %s',
    (valor) => {
      expect(telefoneDe(valor)).toEqual({
        numero: '5548996281475',
        exibicao: '(48) 99628-1475',
        tel: 'tel:+5548996281475',
        whatsapp: 'https://wa.me/5548996281475',
      });
    },
  );
  it('preserva o DDD 55 e formata números fixos', () => {
    expect(telefoneDe('5532221475')?.tel).toBe('tel:+555532221475');
    expect(telefoneDe('55996281475')?.tel).toBe('tel:+5555996281475');
    expect(telefoneDe('+55 48 3028-9989')?.exibicao).toBe('(48) 3028-9989');
  });
  it.each([
    '123',
    '11111111111',
    '(20) 99999-1111',
    '(48) 89999-1111',
    '(48) 6000-1234',
    '529.982.247-25',
    '12.345.678/0001-90',
    'https://site.test/48996281475',
    'id: 48996281475',
    '48996281475e',
    'tel:+5548996281475',
    '+554899628147599',
    null,
  ])('rejeita sequências sem formato válido: %s', (valor) => {
    expect(telefoneDe(valor)).toBeNull();
  });
  it.each(['0800 123 4567', '0300 123 4567', '3003-1234', '4004-1234'])(
    'mantém centrais sem sugerir WhatsApp: %s',
    (valor) => {
      expect(telefoneDe(valor)?.tel).toBe(`tel:${valor.replace(/\D/g, '')}`);
      expect(telefoneDe(valor)?.whatsapp).toBeNull();
    },
  );
  it('mantém números internacionais explícitos', () => {
    expect(telefoneDe('+1 (212) 555-0123')?.tel).toBe('tel:+12125550123');
    expect(telefoneDe('+44 20 7946 0958')?.tel).toBe('tel:+442079460958');
  });
  it('deduplica sem trocar o contato principal nem reescrever o dado original', () => {
    expect(
      telefonesSemDuplicatas([
        '+55 48 99628-1475',
        '48996281475',
        '(48) 99628-1475',
        '123',
        '(48) 3028-9989',
      ]),
    ).toEqual(['+55 48 99628-1475', '(48) 3028-9989']);
  });
  it('deduplica e-mails e rejeita links, cabeçalhos e caracteres de controle', () => {
    expect(
      emailsSemDuplicatas([
        ' CONTATO@Empresa.com.br ',
        'contato@empresa.com.br',
        'time+vendas@empresa.com.br',
        'contato@empresa.com.br?bcc=outro@empresa.com.br',
        'a@empresa.com.br\nbcc:foo@empresa.com.br',
        'mailto:a@empresa.com.br',
        'a..b@empresa.com.br',
      ]),
    ).toEqual(['contato@empresa.com.br', 'time+vendas@empresa.com.br']);
    expect(emailDe('nome@-empresa.com')).toBeNull();
  });
});
