import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ProjetoPortalCliente } from '@/lib/portal-cliente/servico';

vi.mock('@/lib/portal-cliente/actions', () => ({
  decidirEntregaCliente: vi.fn(() => Promise.resolve({})),
  decidirMudancaEscopoCliente: vi.fn(() => Promise.resolve({})),
  concluirPendenciaCliente: vi.fn(() => Promise.resolve({})),
  solicitarMudancaEscopoCliente: vi.fn(() => Promise.resolve({})),
}));

import { PortalProjeto } from './PortalProjeto';

const PROJETO: ProjetoPortalCliente = {
  id: '11111111-1111-4111-8111-111111111111',
  titulo: 'Atendimento inteligente',
  empresa: 'Clínica Aurora',
  resumo: 'Uma operação organizada e mensurável para o atendimento.',
  objetivo: 'Responder rapidamente e transferir com contexto.',
  status: 'em_execucao',
  inicioEm: '2026-08-05T12:00:00.000Z',
  prazoEm: '2026-08-28T12:00:00.000Z',
  feitas: 1,
  total: 2,
  dependencias: [],
  mudancasEscopo: [],
  briefing: {
    objetivo: 'Responder rapidamente e transferir com contexto.',
    criterioSucesso: 'A recepção recebe cada contato com histórico completo.',
    responsavelCliente: 'Camila Rios',
    responsavelTecnico: 'Mateus Silva',
    proximosPassos: ['Liberar o acesso ao WhatsApp Business'],
  },
  eventos: [
    {
      id: '99999999-9999-4999-8999-999999999999',
      tarefaId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      tipo: 'entrega_aprovada',
      autor: 'cliente',
      comentario: 'Documento aprovado.',
      criadoEm: '2026-08-08T12:00:00.000Z',
    },
  ],
  arquivos: [
    {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      tarefaId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      titulo: 'Mapa final da demanda',
      descricao: 'Documento consolidado após a validação.',
      nomeOriginal: 'mapa-final.pdf',
      mimeType: 'application/pdf',
      tamanhoBytes: 240000,
      versao: 2,
      publicadoEm: '2026-08-09T13:00:00.000Z',
    },
  ],
  tarefas: [
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      faseId: 'entender',
      faseTitulo: 'Entender',
      titulo: 'Mapa de demanda',
      concluidoQuando: 'Os horários de pico e os principais assuntos estão documentados.',
      entregavel: 'Mapa validado.',
      ordem: 1,
      status: 'concluida',
      clienteStatus: 'aprovada',
      clienteNota: 'Os horários de pico foram identificados.',
      entregavelUrl: 'https://example.com/mapa',
      solicitadoEm: '2026-08-07T12:00:00.000Z',
      respondidoEm: '2026-08-08T12:00:00.000Z',
      comentario: null,
    },
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
      faseId: 'preparar',
      faseTitulo: 'Preparar',
      titulo: 'Base aprovada',
      concluidoQuando: 'As respostas principais têm fonte e aprovação da responsável.',
      entregavel: 'Base versionada.',
      ordem: 1001,
      status: 'concluida',
      clienteStatus: 'aguardando',
      clienteNota: 'Revise as respostas antes da ativação.',
      entregavelUrl: null,
      solicitadoEm: '2026-08-09T12:00:00.000Z',
      respondidoEm: null,
      comentario: null,
    },
  ],
};

describe('PortalProjeto', () => {
  it('mostra progresso e decisão sem expor o campo de evidência interna', () => {
    render(<PortalProjeto codigo="44444444-4444-4444-8444-444444444444" projeto={PROJETO} />);

    expect(
      screen.getByRole('heading', { name: 'Atendimento inteligente', level: 1 }),
    ).toBeVisible();
    expect(screen.getByText('50%')).toBeVisible();
    expect(screen.getByRole('button', { name: /Aprovar entrega/i })).toBeVisible();
    expect(screen.getByText('Confira antes de aprovar')).toBeVisible();
    expect(
      screen.getByText('As respostas principais têm fonte e aprovação da responsável.'),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: /Baixar/i })).toHaveAttribute(
      'href',
      '/portal/44444444-4444-4444-8444-444444444444/arquivos/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    );
    expect(screen.queryByText(/Evidência da execução/i)).toBeNull();
    expect(screen.getByRole('heading', { name: 'O que foi decidido.' })).toBeVisible();
    expect(screen.getByText('Documento aprovado.')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'O que vamos entregar juntos.' })).toBeVisible();
    const decisao = screen.getByRole('heading', { name: /1 ação espera por você/i });
    const andamento = screen.getByRole('heading', { name: /Da descoberta à entrega/i });
    const arquivos = screen.getByRole('heading', { name: /Arquivos do projeto/i });
    expect(decisao.compareDocumentPosition(andamento) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(andamento.compareDocumentPosition(arquivos) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('apresenta o último aceite como encerramento formal do projeto', () => {
    render(
      <PortalProjeto
        codigo="44444444-4444-4444-8444-444444444444"
        projeto={{ ...PROJETO, status: 'em_validacao', feitas: 2 }}
      />,
    );

    expect(screen.getByText('Aceite final do projeto')).toBeVisible();
    expect(screen.getByRole('button', { name: /Aprovar e concluir/i })).toBeVisible();
  });

  it('coloca uma dependência do cliente antes do andamento do projeto', () => {
    render(
      <PortalProjeto
        codigo="44444444-4444-4444-8444-444444444444"
        projeto={{
          ...PROJETO,
          tarefas: PROJETO.tarefas.map((tarefa) => ({
            ...tarefa,
            clienteStatus: 'nao_solicitada',
          })),
          dependencias: [
            {
              id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
              titulo: 'Liberar o acesso ao WhatsApp Business',
              categoria: 'acesso',
              prazoEm: '2026-08-31T15:00:00.000Z',
              status: 'pendente',
              responsavelNome: 'Camila Rios',
            },
          ],
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: '1 ação espera por você.' })).toBeVisible();
    expect(
      screen.getByRole('heading', { name: 'Liberar o acesso ao WhatsApp Business' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: /Confirmar como resolvido/i })).toBeVisible();
  });

  it('expõe o impacto antes de pedir a aprovação de uma mudança no combinado', () => {
    render(
      <PortalProjeto
        codigo="44444444-4444-4444-8444-444444444444"
        projeto={{
          ...PROJETO,
          mudancasEscopo: [
            {
              id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
              titulo: 'Incluir atendimento pelo Instagram',
              descricao: 'O cliente quer adicionar um novo canal ao agente.',
              status: 'aguardando_cliente',
              classificacao: 'fora_escopo',
              resposta: 'A inclusão exige uma nova integração e testes próprios.',
              impactoPrazoDias: 3,
              impactoValorCentavos: 240000,
              solicitadoPor: 'cliente',
              criadoEm: '2026-08-10T12:00:00.000Z',
              analisadoEm: '2026-08-10T14:00:00.000Z',
              decididoEm: null,
            },
          ],
        }}
      />,
    );

    expect(screen.getByText('Mudança no combinado')).toBeVisible();
    expect(screen.getByText('+3 dias')).toBeVisible();
    expect(screen.getByText('R$ 2.400,00')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Manter o combinado' })).toBeVisible();
    expect(screen.getByRole('button', { name: /Aprovar mudança/i })).toBeVisible();
  });
});
