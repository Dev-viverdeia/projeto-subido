import { describe, expect, it } from 'vitest';
import type { DossieEnriquecido } from './enriquecimento';
import { montarContatosFicha, urlContatoPublica } from './contatos-ficha';

const lead = {
  empresa: {
    nome: 'Empresa',
    dominio: 'empresa.com.br',
    setor: null,
    porte: null,
    cidade: null,
    estado: null,
  },
  contato: {
    nome: 'Ana Lima',
    telefone: '(55) 99999-0000',
    email: ' ANA@EMPRESA.COM.BR ',
    cargo: 'Diretora',
    linkedinUrl: 'https://linkedin.com/in/ana-lima',
  },
};
const dossie = (canais: NonNullable<DossieEnriquecido['inteligenciaContato']>['canais']) =>
  ({ inteligenciaContato: { canais, pessoas: [] } }) as unknown as DossieEnriquecido;

describe('contatos acionáveis da ficha', () => {
  it('prioriza telefone corrigido manualmente sem validar a coleta antiga', () => {
    const atual = {
      ...lead,
      contato: { ...lead.contato, telefone: '1847894818', telefoneManual: true },
    };
    const resultado = montarContatosFicha(atual, null, {
      telefones: ['1847894818', '1833331234'],
      dados: { site_contatos: { telefones: ['1847894818', '1833331234'] } },
    });
    expect(resultado.canais.filter((canal) => canal.tipo === 'telefone')).toEqual([
      expect.objectContaining({
        valor: '(18) 4789-4818',
        fontes: [{ nome: 'Cadastrado na ficha', url: null }],
      }),
    ]);
    expect(resultado.telefonesOcultos).toBe(true);
  });
  it('mostra cadastro sem exigir enriquecimento e mantém DDD 55', () => {
    const resultado = montarContatosFicha(lead);
    expect(resultado.canais.map((item) => item.tipo)).toEqual(['telefone', 'email', 'site']);
    expect(resultado.canais[0]).toMatchObject({
      valor: '(55) 99999-0000',
      href: 'tel:+5555999990000',
      whatsapp: 'https://wa.me/5555999990000',
    });
    expect(resultado.canais[1]?.valor).toBe('ana@empresa.com.br');
    expect(resultado.pessoas[0]?.origem).toBe('Contato da ficha');
  });
  it('deduplica formatos e atribui fonte somente ao campo correspondente', () => {
    const resultado = montarContatosFicha(
      lead,
      dossie([{ tipo: 'telefone', valor: '+5555999990000', origem: 'prospeccao', url: null }]),
      {
        telefones: ['55999990000', '+5555999990000'],
        emails: ['ana@empresa.com.br'],
        site_url: 'https://empresa.com.br/contato',
        maps_url: 'https://maps.google.com/?cid=1',
        dados: {
          mapa_contatos: { telefones: ['+5555999990000'] },
          site_contatos: { emails: ['ANA@EMPRESA.COM.BR'] },
        },
      },
    );
    expect(resultado.canais.filter((item) => item.tipo === 'telefone')).toHaveLength(1);
    expect(resultado.canais[0]?.fontes).toEqual([
      { nome: 'Google Maps', url: 'https://maps.google.com/?cid=1' },
    ]);
    expect(resultado.canais[1]?.fontes).toEqual([
      { nome: 'Site da empresa', url: 'https://empresa.com.br/contato' },
    ]);
  });
  it('não chama um canal sem evidência de encontrado no Google Maps', () => {
    const resultado = montarContatosFicha(lead, null, {
      telefones: ['55999990000'],
      fontes: ['Google Maps'],
    });
    expect(resultado.canais[0]?.fontes[0]?.nome).toBe('Prospecção · fonte não informada');
  });
  it('oculta telefone legado mesmo se copiado como contato principal', () => {
    const salvo = { ...lead, contato: { ...lead.contato, telefone: '1847894818' } };
    const fonte = {
      telefones: ['1847894818'],
      dados: { site_contatos: { telefones: ['1847894818'] } },
    };
    const antes = JSON.stringify({ salvo, fonte });
    const resultado = montarContatosFicha(
      salvo,
      dossie([
        { tipo: 'telefone', valor: '1847894818', origem: 'prospeccao', url: 'tel:1847894818' },
      ]),
      fonte,
    );
    expect(resultado.canais.some((item) => item.tipo === 'telefone')).toBe(false);
    expect(resultado.telefonesOcultos).toBe(true);
    expect(JSON.stringify({ salvo, fonte })).toBe(antes);
  });
  it('lê evidência do snapshot importado quando a lista original não existe', () => {
    const resultado = montarContatosFicha(lead, null, {
      telefones: ['55999990000'],
      dados_publicos: { site_contatos: { telefones: ['55999990000'] } },
    });
    expect(resultado.telefonesOcultos).toBe(true);
  });
  it('preserva número corroborado pelo Maps ou coletado na versão atual', () => {
    for (const dados of [
      {
        site_contatos: { telefones: ['55999990000'] },
        mapa_contatos: { telefones: ['+5555999990000'] },
      },
      { site_contatos: { versao_telefones: 2, telefones: ['55999990000'] } },
    ])
      expect(montarContatosFicha(lead, null, { dados }).canais[0]?.tipo).toBe('telefone');
  });
  it('não restaura contato antigo de snapshot após mudança no cadastro', () => {
    const resultado = montarContatosFicha(
      lead,
      dossie([
        { tipo: 'telefone', valor: '4830289989', url: 'tel:4830289989', origem: 'crm' },
        { tipo: 'email', valor: 'antigo@empresa.com.br', url: null, origem: 'crm' },
        {
          tipo: 'site',
          valor: 'https://antigo.com.br',
          url: 'https://antigo.com.br',
          origem: 'prospeccao',
        },
      ]),
    );
    expect(resultado.canais).toHaveLength(3);
    expect(resultado.canais[2]?.href).toBe('https://empresa.com.br/');
  });
  it('prefere a lista atual a canais de pesquisas desatualizadas', () => {
    const resultado = montarContatosFicha(
      lead,
      dossie([{ tipo: 'telefone', valor: '4830289989', url: null, origem: 'prospeccao' }]),
      { telefones: ['55999990000'] },
    );
    expect(resultado.canais.filter((item) => item.tipo === 'telefone')).toHaveLength(1);
  });
  it('normaliza contatos e reconstrói links sem confiar no href salvo', () => {
    const resultado = montarContatosFicha(
      lead,
      dossie([
        {
          tipo: 'email',
          valor: 'teste@empresa.com.br',
          url: 'javascript:alert(1)',
          origem: 'prospeccao',
        },
        {
          tipo: 'telefone',
          valor: '4830289989',
          url: 'https://fraude.example',
          origem: 'prospeccao',
        },
        {
          tipo: 'instagram',
          valor: '@empresa',
          url: 'https://instagram.com/empresa/?utm_source=a',
          origem: 'prospeccao',
        },
        {
          tipo: 'instagram',
          valor: '@outra',
          url: 'https://instagram.com.fraude.example/empresa',
          origem: 'prospeccao',
        },
        { tipo: 'linkedin', valor: 'Perigoso', url: 'javascript:alert(1)', origem: 'prospeccao' },
      ]),
    );
    expect(resultado.canais.find((item) => item.valor === 'teste@empresa.com.br')?.href).toBe(
      'mailto:teste%40empresa.com.br',
    );
    expect(resultado.canais.find((item) => item.valor === '(48) 3028-9989')?.href).toBe(
      'tel:+554830289989',
    );
    expect(resultado.canais.filter((item) => item.tipo === 'instagram')).toHaveLength(1);
    expect(JSON.stringify(resultado)).not.toContain('javascript:');
    expect(JSON.stringify(resultado)).not.toContain('fraude');
  });
  it('deduplica redes e preserva perfis distintos da mesma rede', () => {
    const canais = [
      'https://instagram.com/empresa',
      'https://www.instagram.com/empresa/',
      'https://instagram.com/outra',
    ].map((url) => ({
      tipo: 'instagram' as const,
      valor: url,
      url,
      origem: 'prospeccao' as const,
    }));
    expect(
      montarContatosFicha(lead, dossie(canais)).canais.filter((item) => item.tipo === 'instagram'),
    ).toHaveLength(2);
  });
  it('não transforma placeholder de contato em pessoa nem cadastro em decisão confirmada', () => {
    const resultado = montarContatosFicha(
      { ...lead, contato: { ...lead.contato, nome: 'Contato a identificar' } },
      null,
      {
        decisores: [
          { nome: 'Marcos Lima', cargo: 'Sócio', linkedin_url: 'https://linkedin.com/in/marcos' },
        ],
      },
    );
    expect(resultado.pessoas).toHaveLength(1);
    expect(resultado.pessoas[0]?.origem).toBe('Vínculo a confirmar');
  });
  it('800 não vira WhatsApp e valores inválidos não criam botões', () => {
    const resultado = montarContatosFicha({
      ...lead,
      contato: { ...lead.contato, telefone: '0800 123 4567', email: 'pessoa\n@empresa.com' },
    });
    expect(resultado.canais[0]).toMatchObject({ href: 'tel:08001234567', whatsapp: null });
    expect(resultado.canais.some((item) => item.tipo === 'email')).toBe(false);
  });
  it('preserva os canais de pessoas da lista atual, identificando a quem pertencem', () => {
    const resultado = montarContatosFicha(
      lead,
      dossie([{ tipo: 'email', valor: 'marcos@empresa.com.br', url: null, origem: 'prospeccao' }]),
      {
        telefones: [],
        emails: [],
        decisores: [
          {
            nome: 'Marcos Lima',
            cargo: 'Sócio',
            email: 'marcos@empresa.com.br',
            telefone: '4830289989',
          },
        ],
      },
    );
    expect(resultado.canais.filter((item) => item.valor === 'marcos@empresa.com.br')).toHaveLength(
      1,
    );
    expect(resultado.canais.find((item) => item.valor === 'marcos@empresa.com.br')).toMatchObject({
      pessoa: 'Marcos Lima',
    });
    expect(resultado.canais.find((item) => item.valor === '(48) 3028-9989')).toMatchObject({
      pessoa: 'Marcos Lima',
    });
    expect(resultado.pessoas[1]?.origem).toBe('Vínculo a confirmar');
  });
  it('não restaura pessoa removida da lista nem contato CRM antigo do enriquecimento', () => {
    const pesquisa = dossie([]);
    pesquisa.inteligenciaContato!.pessoas = [
      {
        nome: 'Antiga Pessoa',
        cargo: null,
        email: 'antiga@empresa.com.br',
        telefone: '4830289989',
        linkedinUrl: null,
        status: 'confirmada',
        evidencia: 'Cadastro anterior',
      },
      {
        nome: 'Pessoa removida',
        cargo: null,
        email: 'removida@empresa.com.br',
        telefone: null,
        linkedinUrl: null,
        status: 'possivel',
        evidencia: 'Perfil',
      },
    ];
    const resultado = montarContatosFicha(lead, pesquisa, { decisores: [] });
    expect(resultado.pessoas.map((item) => item.nome)).toEqual(['Ana Lima']);
    expect(resultado.canais.filter((item) => item.tipo === 'email')).toHaveLength(1);
  });
  it('recupera pessoa possível do snapshot quando não há mais lista vinculada', () => {
    const pesquisa = dossie([]);
    pesquisa.inteligenciaContato!.pessoas = [
      {
        nome: 'Marcos Lima',
        cargo: 'Sócio',
        email: 'marcos@empresa.com.br',
        telefone: null,
        linkedinUrl: null,
        status: 'possivel',
        evidencia: 'Perfil',
      },
    ];
    const resultado = montarContatosFicha(lead, pesquisa);
    expect(resultado.pessoas[1]?.nome).toBe('Marcos Lima');
    expect(resultado.canais.find((item) => item.valor === 'marcos@empresa.com.br')?.pessoa).toBe(
      'Marcos Lima',
    );
  });
});

describe('URLs de contato', () => {
  it.each([
    'javascript:alert(1)',
    'mailto:a@b.com',
    'data:text/html,a',
    'https://senha@empresa.com',
    'https://empresa.com\n.evil.com',
    '',
  ])('rejeita %s', (url) => expect(urlContatoPublica(url)).toBeNull());
  it('aceita domínio e URL sem duplicar o protocolo', () => {
    expect(urlContatoPublica('empresa.com.br')).toBe('https://empresa.com.br/');
    expect(urlContatoPublica('https://empresa.com.br')).toBe('https://empresa.com.br/');
  });
});
