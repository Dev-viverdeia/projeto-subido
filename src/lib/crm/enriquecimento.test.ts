import { describe, expect, it } from 'vitest';
import { lerDossie, lerFontes, obterRoteiroCall } from './enriquecimento';

const DOSSIE = {
  resumo: 'A empresa concentra o atendimento em um canal e precisa validar volume e processo.',
  empresa: {
    setor: 'Saúde',
    porte: null,
    cidade: 'São Paulo',
    estado: 'SP',
    modeloNegocio: 'Clínica particular',
  },
  fatos: [
    {
      titulo: 'Canal de atendimento',
      valor: 'O site direciona para WhatsApp.',
      origem: 'site',
      urlFonte: 'https://exemplo.com/',
    },
  ],
  hipoteses: [
    {
      titulo: 'Triagem manual',
      explicacao: 'O site não coleta o motivo do contato.',
      confianca: 'media',
      comoValidar: 'Perguntar quais dados são coletados antes do agendamento.',
    },
  ],
  oportunidades: [
    {
      titulo: 'Triagem assistida',
      impacto: 'Reduzir perguntas repetidas.',
      porQueAgora: 'O canal atual já concentra a demanda.',
      abertura: 'Quero entender como vocês fazem a triagem hoje.',
    },
  ],
  perguntasDescoberta: ['Quantas conversas chegam por dia?'],
  proximaAcao: { acao: 'Agendar call de descoberta.', porque: 'O processo precisa ser validado.' },
  alertas: [],
};

describe('leitura do enriquecimento', () => {
  it('aceita um dossiê estruturado e preserva a separação entre fato e hipótese', () => {
    const dossie = lerDossie(DOSSIE);
    expect(dossie?.fatos[0]?.origem).toBe('site');
    expect(dossie?.hipoteses[0]?.confianca).toBe('media');
  });

  it('transforma enriquecimentos anteriores em um roteiro comercial ligado ao projeto', () => {
    const dossie = lerDossie(DOSSIE);
    expect(dossie).not.toBeNull();

    const roteiro = obterRoteiroCall(dossie!);
    expect(roteiro.objetivo).toContain('Triagem assistida');
    expect(roteiro.perguntas).toHaveLength(5);
    expect(roteiro.perguntas.map((pergunta) => pergunta.etapa)).toEqual([
      'contexto',
      'processo',
      'processo',
      'impacto',
      'decisao',
    ]);
    expect(roteiro.perguntas[1]?.projetoRelacionado).toBe('Triagem assistida');
    expect(roteiro.fechamento.proximoPasso).toBe('Agendar call de descoberta.');
  });

  it('recusa payload incompleto e descarta fontes fora do contrato', () => {
    expect(lerDossie({ resumo: 'sem estrutura' })).toBeNull();
    expect(lerFontes([{ tipo: 'internet-inteira', titulo: 'Sem origem', status: 'lida' }])).toEqual(
      [],
    );
  });
});
