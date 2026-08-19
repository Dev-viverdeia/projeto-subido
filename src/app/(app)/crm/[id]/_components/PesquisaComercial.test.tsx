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

    fireEvent.click(screen.getByRole('tab', { name: 'Preparar conversa' }));
    expect(screen.getByText('Quantas conversas chegam por dia?')).toBeVisible();
    expect(screen.getByText('SDR de atendimento')).toBeVisible();

    fireEvent.click(screen.getByRole('tab', { name: 'Dados e fontes' }));
    expect(screen.getByText('Site da empresa')).toBeVisible();
    expect(screen.getByText('O volume ainda não foi confirmado.')).toBeVisible();
  });
});
