import { describe, expect, it } from 'vitest';
import {
  DocumentoPropostaSchema,
  centavosParaCampo,
  formatarReais,
  reaisParaCentavos,
} from './schema';

const VALIDO = {
  cliente: { empresa: 'Acme', contato: 'Ana', cargo: 'CEO', email: 'ana@acme.com.br' },
  projeto: {
    titulo: 'Atendimento com IA',
    resumo: 'Uma operação de atendimento organizada e assistida por inteligência artificial.',
    origem: 'catalogo',
  },
  desafio: 'O time perde tempo em tarefas repetitivas e não mede a qualidade do atendimento.',
  objetivo: 'Reduzir o tempo de resposta sem perder contexto ou qualidade.',
  escopo: [{ titulo: 'Diagnóstico', descricao: 'Mapear o fluxo atual e definir as prioridades.' }],
  entregaveis: ['Fluxo configurado'],
  cronograma: [{ fase: 'Fundação', duracao: '1 semana', descricao: 'Mapeamento e desenho.' }],
  investimento: { valorCentavos: 1250000, condicoes: '50% no início e 50% na entrega.' },
  validadeDias: 15,
  proximosPassos: ['Aprovar a proposta'],
  observacoes: null,
} as const;

describe('contrato da proposta', () => {
  it('aceita um documento completo e rejeita lista vazia', () => {
    expect(DocumentoPropostaSchema.safeParse(VALIDO).success).toBe(true);
    expect(DocumentoPropostaSchema.safeParse({ ...VALIDO, escopo: [] }).success).toBe(false);
  });

  it('converte valores brasileiros sem perder centavos', () => {
    expect(reaisParaCentavos('12.500,90')).toBe(1_250_090);
    expect(centavosParaCampo(1_250_090)).toBe('12.500,90');
    expect(formatarReais(1_250_090)).toContain('12.500,90');
  });

  it('mantém valor a definir como ausência, não como zero', () => {
    expect(reaisParaCentavos('')).toBeNull();
    expect(centavosParaCampo(null)).toBe('');
    expect(formatarReais(null)).toBe('A definir');
  });

  it('aceita identidade comercial e checkout externo válidos', () => {
    const documento = DocumentoPropostaSchema.parse({
      ...VALIDO,
      fornecedor: {
        nomeResponsavel: 'Ana Lima',
        nomeNegocio: 'Ana Lima IA',
        email: 'ana@empresa.com.br',
        telefone: '(11) 99999-9999',
        site: 'https://empresa.com.br',
        logoUrl: 'https://arquivos.empresa.com.br/logo.png',
      },
      investimento: {
        ...VALIDO.investimento,
        linkPagamento: 'https://checkout.empresa.com.br/projeto',
      },
    });

    expect(documento.fornecedor?.nomeNegocio).toBe('Ana Lima IA');
    expect(documento.investimento.linkPagamento).toContain('checkout');
  });
});
