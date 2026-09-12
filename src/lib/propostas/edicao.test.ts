import { expect, it } from 'vitest';
import { compararEdicoes, mesmoConteudo } from './edicao';
import { EDICAO_TESTE as base } from './edicao.fixture';

it('status/versão não são diferenças de conteúdo', () => {
  const outra = { ...base, status: 'aceita' as const, versao: 3 };
  expect(mesmoConteudo(base, outra)).toBe(true);
  expect(compararEdicoes(base, outra)).toEqual([]);
});
it('normaliza pela mesma regra do servidor sem depender da ordem das chaves JSON', () => {
  expect(
    mesmoConteudo(base, {
      ...base,
      titulo: ` ${base.titulo} `,
      documento: {
        ...base.documento,
        cliente: { email: null, cargo: null, contato: null, empresa: 'Empresa de teste' },
      },
    }),
  ).toBe(true);
});
it('mostra valor, itens removidos/adicionados, conteúdo longo e fornecedor completo', () => {
  const outra = structuredClone(base);
  outra.documento.investimento.valorCentavos = 200000;
  outra.documento.entregaveis.push('Material extra');
  outra.documento.fornecedor = {
    nomeResponsavel: 'Pessoa de teste',
    nomeNegocio: null,
    email: null,
    telefone: null,
    site: null,
    logoUrl: 'https://example.test/logo.png',
  };
  outra.documento.observacoes = 'Texto longo '.repeat(100);
  const dif = compararEdicoes(base, outra);
  expect(dif.map((d) => d.rotulo)).toEqual([
    'Responsável',
    'Entregáveis',
    'Valor e condições',
    'Observações',
  ]);
  expect(dif[0]?.salva).toContain('https://example.test/logo.png');
  expect(dif[1]?.salva).toContain('Material extra');
  expect(dif[2]?.salva).toContain('2.000,00');
  expect(dif[3]?.salva).toBe(outra.documento.observacoes);
});
