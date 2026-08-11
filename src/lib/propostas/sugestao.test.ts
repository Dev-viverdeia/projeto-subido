import { describe, expect, it } from 'vitest';
import { sugerirProjetoBase } from './sugestao';

const PROJETOS = [
  { slug: 'atendimento-com-ia-no-whatsapp', titulo: 'Atendimento com IA no WhatsApp' },
  { slug: 'qualificacao-de-leads-com-ia', titulo: 'Qualificação de Leads com IA' },
  { slug: 'crm-comercial-com-ia', titulo: 'CRM Comercial com IA' },
  { slug: 'maquina-de-conteudo-com-ia', titulo: 'Máquina de Conteúdo com IA' },
  { slug: 'financeiro-sem-planilhas', titulo: 'Financeiro sem Planilhas' },
];

describe('sugestão de Projeto para a proposta', () => {
  it('recomenda atendimento a partir do problema explícito do lead', () => {
    expect(sugerirProjetoBase('Automação do atendimento', PROJETOS)).toBe(
      'projeto:atendimento-com-ia-no-whatsapp',
    );
  });

  it('não inventa recomendação sem sinal suficiente', () => {
    expect(sugerirProjetoBase('Projeto estratégico 2027', PROJETOS)).toBeNull();
  });

  it('não recomenda um Projeto indisponível', () => {
    expect(sugerirProjetoBase('Organizar o financeiro', PROJETOS.slice(0, 2))).toBeNull();
  });
});
