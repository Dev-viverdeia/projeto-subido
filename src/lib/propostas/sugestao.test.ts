import { describe, expect, it } from 'vitest';
import { sugerirProjetoBase } from './sugestao';

const PROJETOS = [
  { slug: 'sdr-atendimento-qualificacao', titulo: 'SDR de Atendimento e Qualificação' },
  { slug: 'maquina-prospeccao-b2b', titulo: 'Máquina de Prospecção B2B' },
  { slug: 'inteligencia-comercial-com-ia', titulo: 'Inteligência Comercial com IA' },
  { slug: 'operacao-conteudo-multicanal', titulo: 'Operação de Conteúdo Multicanal' },
  { slug: 'radar-satisfacao-com-ia', titulo: 'Radar de Satisfação com IA' },
];

describe('sugestão de Projeto para a proposta', () => {
  it('recomenda atendimento a partir do problema explícito do lead', () => {
    expect(sugerirProjetoBase('Automação do atendimento', PROJETOS)).toBe(
      'projeto:sdr-atendimento-qualificacao',
    );
  });

  it('não inventa recomendação sem sinal suficiente', () => {
    expect(sugerirProjetoBase('Projeto estratégico 2027', PROJETOS)).toBeNull();
  });

  it('não recomenda um Projeto indisponível', () => {
    expect(sugerirProjetoBase('Implantar uma pesquisa NPS', PROJETOS.slice(0, 2))).toBeNull();
  });

  it('recomenda o Radar quando a dor explícita é satisfação do cliente', () => {
    expect(sugerirProjetoBase('Pesquisa NPS e recuperação de detratores', PROJETOS)).toBe(
      'projeto:radar-satisfacao-com-ia',
    );
  });
});
