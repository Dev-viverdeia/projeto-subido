import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { DossieEnriquecido } from '@/lib/crm/enriquecimento';
import type { DossieLead, ExecucaoEnriquecimento } from '@/lib/crm/queries';
import { PesquisaComercial } from './PesquisaComercial';

vi.mock('./BotaoProximaAcao', () => ({
  BotaoProximaAcao: () => <button type="button">Usar como próxima ação</button>,
}));

const DOSSIE: DossieEnriquecido = {
  resumo: 'A empresa recebe pedidos pelo WhatsApp e precisa confirmar o volume antes do piloto.',
  empresa: {
    setor: 'Saúde',
    porte: 'Médio',
    cidade: 'São Paulo',
    estado: 'SP',
    modeloNegocio: 'Clínica particular',
  },
  fatos: [
    {
      titulo: 'WhatsApp em destaque',
      valor: 'O canal aparece no site.',
      origem: 'site',
      urlFonte: 'https://empresa.com.br',
    },
  ],
  hipoteses: [
    {
      titulo: 'Há espera no atendimento',
      explicacao: 'O prazo não aparece no site.',
      confianca: 'media',
      comoValidar: 'Pergunte o tempo médio de resposta.',
    },
  ],
  oportunidades: [
    {
      titulo: 'SDR de atendimento',
      impacto: 'Responder mais rápido.',
      porQueAgora: 'O canal já concentra demanda.',
      abertura: 'Quantas conversas chegam por dia?',
    },
  ],
  perguntasDescoberta: ['Quantas conversas chegam por dia?'],
  roteiroCall: {
    objetivo: 'Confirmar se o volume no WhatsApp justifica um SDR de Atendimento e Qualificação.',
    abertura:
      'Vi que o WhatsApp concentra a demanda. Quero entender onde o atendimento trava antes de sugerir um piloto.',
    perguntas: [
      {
        etapa: 'contexto',
        pergunta: 'Qual resultado do atendimento é prioridade neste trimestre?',
        intencao: 'Definir a métrica que deve orientar um possível piloto.',
        projetoRelacionado: null,
      },
      {
        etapa: 'processo',
        pergunta: 'O que acontece desde a primeira mensagem até o agendamento?',
        intencao: 'Mapear o fluxo e localizar o gargalo operacional.',
        projetoRelacionado: 'SDR de Atendimento e Qualificação',
      },
      {
        etapa: 'impacto',
        pergunta: 'Quantas conversas deixam de virar agendamento em uma semana?',
        intencao: 'Dimensionar o impacto que o piloto precisaria demonstrar.',
        projetoRelacionado: 'SDR de Atendimento e Qualificação',
      },
      {
        etapa: 'decisao',
        pergunta: 'Quem aprova o piloto e qual resultado essa pessoa precisa ver?',
        intencao: 'Identificar o decisor e o critério real para avançar.',
        projetoRelacionado: 'SDR de Atendimento e Qualificação',
      },
    ],
    fechamento: {
      sinalParaAvancar: 'Volume, gargalo e critério do piloto foram confirmados.',
      frase: 'Faz sentido mapearmos uma semana de conversas e desenharmos o piloto?',
      proximoPasso: 'Mapear uma semana de conversas.',
    },
  },
  proximaAcao: {
    acao: 'Medir o volume de uma semana.',
    porque: 'O piloto depende do volume real.',
  },
  alertas: ['O volume ainda não foi confirmado.'],
};

const EXECUCAO: ExecucaoEnriquecimento = {
  id: '88888888-8888-4888-8888-888888888888',
  status: 'concluido',
  dominio: 'empresa.com.br',
  linkedinUrl: null,
  erro: null,
  solicitadoEm: '2026-08-08T18:08:00.000Z',
  concluidoEm: '2026-08-08T18:10:00.000Z',
  dossie: DOSSIE,
  fontes: [
    {
      tipo: 'site',
      titulo: 'Site da empresa',
      url: 'https://empresa.com.br',
      status: 'lida',
    },
  ],
};

const LEAD = {
  oportunidade: {
    id: '11111111-1111-4111-8111-111111111111',
    etapa: 'descoberta',
    proximaAcao: null,
  },
  empresa: {
    nome: 'Empresa teste',
    setor: 'Saúde',
    porte: 'Médio',
  },
  contato: {
    nome: 'Ana Lima',
    cargo: 'Diretora',
    email: 'ana@empresa.com.br',
    telefone: null,
  },
} as DossieLead;

describe('PesquisaComercial', () => {
  it('separa a leitura, o preparo da conversa e as fontes', () => {
    render(<PesquisaComercial lead={LEAD} execucao={EXECUCAO} dossie={DOSSIE} />);

    expect(screen.getByRole('heading', { name: DOSSIE.resumo })).toBeVisible();
    expect(screen.getByText('WhatsApp em destaque')).toBeVisible();
    expect(screen.queryByText('Quantas conversas chegam por dia?')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Preparar reunião' }));
    expect(screen.getByText(DOSSIE.roteiroCall!.objetivo)).toBeVisible();
    expect(screen.getByText(/Vi que o WhatsApp concentra a demanda/)).toBeVisible();
    expect(
      screen.getByText('Quantas conversas deixam de virar agendamento em uma semana?'),
    ).toBeVisible();
    expect(screen.getByText('Dimensionar')).toBeVisible();
    expect(
      screen.getByText('Dimensionar o impacto que o piloto precisaria demonstrar.'),
    ).toBeVisible();
    expect(screen.getAllByText('SDR de Atendimento e Qualificação').length).toBeGreaterThan(0);
    expect(
      screen.getByRole('heading', { name: 'Saia com um próximo passo combinado' }),
    ).toBeVisible();
    expect(screen.getByText(/Faz sentido mapearmos uma semana/)).toBeVisible();
    expect(screen.getByText('SDR de atendimento')).toBeVisible();

    fireEvent.click(screen.getByRole('tab', { name: 'Dados e fontes' }));
    expect(screen.getByText('Site da empresa')).toBeVisible();
    expect(screen.getByText('O volume ainda não foi confirmado.')).toBeVisible();
  });
});
