import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ProjetoPortalCliente } from '@/lib/portal-cliente/servico';

vi.mock('@/lib/portal-cliente/actions', () => ({
  decidirEntregaCliente: vi.fn(() => Promise.resolve({})),
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
    expect(screen.getByRole('link', { name: /Baixar/i })).toHaveAttribute(
      'href',
      '/portal/44444444-4444-4444-8444-444444444444/arquivos/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    );
    expect(screen.queryByText(/Evidência da execução/i)).toBeNull();
  });
});
