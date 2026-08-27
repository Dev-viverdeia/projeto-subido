import { describe, expect, it } from 'vitest';
import type { DossieEnriquecido } from '@/lib/crm/enriquecimento';
import { montarPlanoCall } from './plano';

const DOSSIE: DossieEnriquecido = {
  resumo: 'A clínica recebe muitas mensagens e perde contatos fora do horário.',
  empresa: {
    setor: 'Saúde',
    porte: 'Médio',
    cidade: 'Belo Horizonte',
    estado: 'MG',
    modeloNegocio: 'Clínica particular',
  },
  fatos: [{ titulo: 'Canal principal', valor: 'WhatsApp', origem: 'site' }],
  hipoteses: [
    {
      titulo: 'Perda de leads fora do horário',
      explicacao: 'Há atendimento limitado.',
      confianca: 'media',
      comoValidar: 'Quantos contatos chegam fora do horário?',
    },
  ],
  oportunidades: [
    {
      titulo: 'SDR de atendimento com IA',
      impacto: 'Responder mais rápido.',
      porQueAgora: 'Volume crescente.',
      abertura: 'Como os contatos são distribuídos hoje?',
    },
  ],
  perguntasDescoberta: ['Quem aprova um piloto?'],
  roteiroCall: {
    objetivo: 'Confirmar se o SDR resolve a perda de contatos.',
    abertura: 'Quero entender o fluxo antes de sugerir uma solução.',
    perguntas: [
      {
        etapa: 'processo',
        pergunta: 'Como os contatos são distribuídos hoje?',
        intencao: 'Entender o gargalo.',
        projetoRelacionado: 'SDR de atendimento com IA',
      },
      {
        etapa: 'impacto',
        pergunta: 'Quantas oportunidades são perdidas por mês?',
        intencao: 'Dimensionar o impacto.',
        projetoRelacionado: 'SDR de atendimento com IA',
      },
    ],
    fechamento: {
      sinalParaAvancar: 'Dor e impacto confirmados.',
      frase: 'Faz sentido desenhar um piloto?',
      proximoPasso: 'Marcar reunião técnica.',
    },
  },
  proximaAcao: { acao: 'Marcar reunião técnica.', porque: 'Validar integração.' },
  alertas: [],
};

describe('montarPlanoCall', () => {
  it('usa o roteiro personalizado do enriquecimento em uma reunião de descoberta', () => {
    const plano = montarPlanoCall({
      tipo: 'descoberta',
      empresa: 'Clínica Horizonte',
      oportunidade: 'SDR de atendimento',
      proximaAcao: null,
      dossie: DOSSIE,
    });

    expect(plano.origem).toBe('enriquecimento');
    expect(plano.objetivo).toBe(DOSSIE.roteiroCall?.objetivo);
    expect(plano.perguntas[0]?.pergunta).toBe('Como os contatos são distribuídos hoje?');
    expect(plano.fatos).toContain('Canal principal: WhatsApp');
    expect(plano.projetos).toContain('SDR de atendimento com IA');
  });

  it('mantém uma condução de proposta e incorpora perguntas específicas do cliente', () => {
    const plano = montarPlanoCall({
      tipo: 'proposta',
      empresa: 'Clínica Horizonte',
      oportunidade: 'SDR de atendimento',
      proximaAcao: 'Receber decisão até sexta-feira.',
      dossie: DOSSIE,
    });

    expect(plano.objetivo).toContain('conduzir uma decisão');
    expect(plano.perguntas.some((item) => item.pergunta.includes('oportunidades'))).toBe(true);
    expect(plano.fechamento.proximoPasso).toBe('Marcar reunião técnica.');
  });
});
