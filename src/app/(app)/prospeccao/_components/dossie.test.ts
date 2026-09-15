import { describe, expect, it } from 'vitest';
import {
  decisoresDo,
  emailsDo,
  fonteDoContato,
  redesDo,
  telefonesDo,
  temTelefonesLegadosOcultos,
  type Lead,
} from './dossie';

function lead(dados: Partial<Lead>): Lead {
  return {
    telefone: null,
    telefones: [],
    emails: [],
    redes_sociais: [],
    decisores: [],
    fontes: [],
    dados: {},
    ...dados,
  } as Lead;
}

describe('curadoria de contatos já salvos', () => {
  it('não promove IDs de uma coleta antiga a telefone mesmo quando o formato é plausível', () => {
    const salvo = lead({
      telefone: '+554830289989',
      telefones: ['1847894818', '+551847894818', '554830289989'],
      dados: { site_contatos: { telefones: ['1847894818'] } },
    });
    const antes = JSON.stringify(salvo);
    expect(telefonesDo(salvo)).toEqual(['(48) 3028-9989']);
    expect(temTelefonesLegadosOcultos(salvo)).toBe(true);
    expect(JSON.stringify(salvo)).toBe(antes);
  });
  it('preserva o canal com evidência do Maps mesmo quando também consta no site antigo', () => {
    const salvo = lead({
      telefone: '+554830289989',
      dados: {
        site_contatos: { telefones: ['4830289989'] },
        mapa_contatos: { telefones: ['+55 48 3028-9989'] },
      },
    });
    expect(telefonesDo(salvo)).toEqual(['(48) 3028-9989']);
    expect(temTelefonesLegadosOcultos(salvo)).toBe(false);
  });
  it('aceita os canais coletados pelo extrator atual e não confunde a versão antiga', () => {
    const salvo = lead({
      telefone: '(48) 3028-9989',
      dados: { site_contatos: { versao_telefones: 2, telefones: ['4830289989'] } },
    });
    expect(telefonesDo(salvo)).toEqual(['(48) 3028-9989']);
    expect(temTelefonesLegadosOcultos(salvo)).toBe(false);
    expect(
      telefonesDo({
        ...salvo,
        dados: { site_contatos: { versao_telefones: 1, telefones: ['4830289989'] } },
      }),
    ).toEqual([]);
  });
  it('oculta formatos inválidos e duplicações sem mutar o registro', () => {
    const salvo = lead({
      telefone: '123',
      telefones: ['(48) 99628-1475', '+5548996281475', 'CPF 123.456.789-00'],
      emails: [' CONTATO@EMPRESA.COM.BR ', 'contato@empresa.com.br'],
    });
    const antes = JSON.stringify(salvo);
    expect(telefonesDo(salvo)).toEqual(['(48) 99628-1475']);
    expect(emailsDo(salvo)).toEqual(['contato@empresa.com.br']);
    expect(JSON.stringify(salvo)).toBe(antes);
  });
  it('atribui fontes apenas quando há correspondência por contato', () => {
    const salvo = lead({
      fontes: ['Google Maps · dados públicos', 'Site oficial · conteúdo público'],
      telefone: '+5548996281475',
      dados: {
        mapa_contatos: { telefones: ['48996281475'] },
        site_contatos: {
          telefones: ['+55 48 99628-1475'],
          emails: ['CONTATO@EMPRESA.COM.BR'],
          redes_sociais: [{ rede: 'instagram', url: 'https://instagram.com/empresa/reels/' }],
        },
      },
    });
    expect(fonteDoContato(salvo, 'telefone', '(48) 99628-1475')).toBe(
      'Site da empresa · Google Maps',
    );
    expect(fonteDoContato(salvo, 'email', 'contato@empresa.com.br')).toBe('Site da empresa');
    expect(fonteDoContato(salvo, 'rede', 'https://instagram.com/empresa')).toBe('Site da empresa');
    expect(fonteDoContato(salvo, 'telefone', '(48) 3028-9989')).toBe('Fonte não informada');
    expect(
      fonteDoContato(
        lead({ telefone: '+5548996281475', fontes: ['Google Maps'] }),
        'telefone',
        '(48) 99628-1475',
      ),
    ).toBe('Fonte não informada');
  });
  it('não perde um perfil válido porque o primeiro da mesma rede era inválido', () => {
    expect(
      redesDo(
        lead({
          redes_sociais: [
            { rede: 'instagram', url: 'javascript:alert(1)' },
            { rede: 'instagram', url: 'https://instagram.com/empresa/reels/' },
          ],
        }),
      ),
    ).toEqual([{ rede: 'instagram', url: 'https://instagram.com/empresa' }]);
  });
  it('aplica a mesma validação aos canais dos possíveis decisores', () => {
    expect(
      decisoresDo(
        lead({
          decisores: [
            {
              nome: 'Pessoa',
              telefone: '529.982.247-25',
              email: 'contato@empresa.com.br?bcc=x@empresa.com.br',
            },
          ],
        }),
      )[0],
    ).toMatchObject({ telefone: null, email: null });
  });
});
