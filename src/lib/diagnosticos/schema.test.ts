import { describe, expect, it } from 'vitest';
import {
  calcularNotaGeral,
  RelatorioDiagnosticoSchema,
  restringirProjetosDoRelatorio,
} from './schema';

const DIMENSAO = {
  nota: 80,
  cobertura: 'observada' as const,
  leitura: 'O canal é encontrado com facilidade e orienta o primeiro contato.',
  evidencias: [
    { trecho: 'Fale com nossa equipe', origem: 'site' as const, fonte: 'Página inicial' },
  ],
  comoValidar: 'Percorrer novamente a jornada em uma janela anônima.',
};

const RELATORIO = RelatorioDiagnosticoSchema.parse({
  resumo: 'O atendimento tem um ponto de entrada claro, mas ainda perde contexto na continuidade.',
  veredito: 'A entrada funciona; o maior risco está depois do primeiro contato.',
  cobertura: 'substancial',
  aviso_escopo: 'A leitura considera o site e uma conversa autorizada fornecida pelo profissional.',
  dimensoes: {
    acesso: DIMENSAO,
    clareza: { ...DIMENSAO, nota: 70 },
    contexto: { ...DIMENSAO, nota: null, cobertura: 'nao_observada' },
    continuidade: { ...DIMENSAO, nota: 50 },
    confianca: { ...DIMENSAO, nota: 60 },
  },
  fatos: [],
  falhas: [],
  hipoteses: [],
  oportunidades: [
    {
      titulo: 'Triagem assistida',
      impacto: 'Organizar cada solicitação antes do encaminhamento.',
      mecanismo: 'Coletar motivo, urgência e identificação antes da transferência.',
      evidencia_base: 'A conversa fornecida não registra o motivo do contato.',
      projeto_slug: 'inventado',
      projeto_titulo: 'Projeto inventado',
    },
  ],
  plano_correcao: [
    {
      ordem: 1,
      acao: 'Definir os campos mínimos da triagem.',
      resultado_esperado: 'Cada conversa chega ao responsável com contexto suficiente.',
      evidencia_conclusao: 'Roteiro aprovado e testado em cinco conversas.',
    },
  ],
  perguntas_descoberta: [],
  proxima_acao_comercial: {
    acao: 'Validar o diagnóstico com a pessoa responsável pelo atendimento.',
    porque: 'A validação separa falhas observadas de regras internas ainda desconhecidas.',
  },
});

describe('relatório do diagnóstico', () => {
  it('calcula a nota apenas com dimensões observadas', () => {
    expect(calcularNotaGeral(RELATORIO)).toBe(65);
  });

  it('remove projeto que não existe no catálogo real', () => {
    const seguro = restringirProjetosDoRelatorio(RELATORIO, [
      { slug: 'atendimento-com-ia-no-whatsapp', titulo: 'Atendimento com IA no WhatsApp' },
    ]);
    expect(seguro.oportunidades[0]?.projeto_slug).toBeNull();
    expect(seguro.oportunidades[0]?.projeto_titulo).toBeNull();
  });
});
