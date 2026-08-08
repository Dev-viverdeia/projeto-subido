// @vitest-environment node

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { PropostaCompleta } from './queries';

vi.mock('server-only', () => ({}));

const PROPOSTA: PropostaCompleta = {
  id: '11111111-1111-4111-8111-111111111111',
  titulo: 'Proposta · Atendimento com IA',
  status: 'pronta',
  versao: 3,
  atualizadoEm: '2026-08-07T18:00:00Z',
  criadoEm: '2026-08-07T17:00:00Z',
  empresa: 'Clínica Horizonte',
  projeto: 'Atendimento com IA',
  valorCentavos: 1_800_000,
  empresaId: '22222222-2222-4222-8222-222222222222',
  oportunidadeId: '33333333-3333-4333-8333-333333333333',
  projetoId: '44444444-4444-4444-8444-444444444444',
  builderSolucaoId: null,
  documento: {
    cliente: {
      empresa: 'Clínica Horizonte',
      contato: 'Marina Alves',
      cargo: 'Diretora de Operações',
      email: 'marina@clinicahorizonte.com.br',
    },
    projeto: {
      titulo: 'Atendimento com IA',
      resumo:
        'Uma operação de atendimento organizada, assistida por inteligência artificial e pronta para crescer sem perder contexto.',
      origem: 'catalogo',
    },
    desafio:
      'A clínica recebe um volume alto de mensagens em diferentes canais. Nas trocas de turno, o contexto se perde, o tempo de primeira resposta aumenta e a liderança não consegue enxergar onde estão os gargalos da operação.',
    objetivo:
      'Diminuir o tempo de primeira resposta, organizar cada solicitação e criar uma visão clara da qualidade do atendimento.',
    escopo: [
      {
        titulo: 'Entender a operação',
        descricao:
          'Mapear canais, tipos de solicitação, responsáveis e critérios usados hoje para priorizar cada conversa.',
      },
      {
        titulo: 'Preparar a base',
        descricao:
          'Organizar o conhecimento da clínica e definir as regras que a inteligência artificial deve respeitar.',
      },
      {
        titulo: 'Construir os fluxos',
        descricao:
          'Configurar a triagem assistida, o histórico central e as respostas recomendadas para os principais cenários.',
      },
      {
        titulo: 'Validar com o time',
        descricao:
          'Testar conversas reais, revisar exceções e medir qualidade antes de liberar a operação completa.',
      },
      {
        titulo: 'Entregar e acompanhar',
        descricao:
          'Capacitar responsáveis, documentar a rotina e acompanhar os primeiros resultados da operação.',
      },
    ],
    entregaveis: [
      'Mapa da jornada de atendimento',
      'Base de conhecimento organizada',
      'Fluxo de triagem assistida por IA',
      'Biblioteca de respostas recomendadas',
      'Painel com indicadores essenciais',
      'Documentação e sessão de capacitação',
    ],
    cronograma: [
      {
        fase: 'Diagnóstico e desenho',
        duracao: '1 semana',
        descricao: 'Mapeamento da operação, prioridades e critérios de sucesso.',
      },
      {
        fase: 'Construção',
        duracao: '2 semanas',
        descricao: 'Configuração dos fluxos, conhecimento e indicadores.',
      },
      {
        fase: 'Validação e entrega',
        duracao: '1 semana',
        descricao: 'Testes com o time, ajustes, documentação e capacitação.',
      },
    ],
    investimento: {
      valorCentavos: 1_800_000,
      condicoes: '50% na aprovação desta proposta e 50% na entrega da operação validada.',
    },
    validadeDias: 15,
    proximosPassos: [
      'Validar o escopo e os responsáveis internos.',
      'Aprovar esta proposta comercial.',
      'Realizar a reunião de início do projeto.',
    ],
    observacoes:
      'Integrações que dependam de licenças de terceiros serão confirmadas antes da contratação.',
  },
};

describe('PDF da proposta', () => {
  it('gera um documento real e deixa uma amostra para inspeção visual', async () => {
    const { renderizarPropostaPdf } = await import('./pdf');
    const pdf = await renderizarPropostaPdf({
      proposta: PROPOSTA,
      profissional: 'Rafael Milagre',
      geradoEm: new Date('2026-08-07T18:00:00-03:00'),
    });

    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    expect(pdf.byteLength).toBeGreaterThan(15_000);

    const pasta = path.join(process.cwd(), 'tmp/pdfs');
    await mkdir(pasta, { recursive: true });
    await writeFile(path.join(pasta, 'proposta-comercial-exemplo.pdf'), pdf);
  });
});
