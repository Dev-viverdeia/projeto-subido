import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type {
  ArquivoProjetoExecucao,
  TarefaProjetoExecucao,
} from '@/lib/projetos-execucao/queries';

const { definirVisibilidade, refresh } = vi.hoisted(() => ({
  definirVisibilidade: vi.fn(() => Promise.resolve({ sucesso: 'Arquivo liberado.' })),
  refresh: vi.fn(),
}));

vi.mock('@/lib/projetos-execucao/actions', () => ({
  definirVisibilidadeArquivoProjeto: definirVisibilidade,
  excluirArquivoProjeto: vi.fn(),
  registrarArquivoProjeto: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

import { CentralArquivos } from './CentralArquivos';

const TAREFA: TarefaProjetoExecucao = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  faseId: 'entender',
  faseTitulo: 'Entender',
  passoId: '1',
  titulo: 'Mapear demanda',
  acao: 'Mapear as conversas.',
  concluidoQuando: 'Mapa pronto.',
  entregavel: 'Mapa de demanda.',
  ordem: 1,
  status: 'concluida',
  evidencia: null,
  evidenciaEm: null,
  concluidaEm: null,
  clienteStatus: 'nao_solicitada',
  clienteNota: null,
  entregavelUrl: null,
  clienteSolicitadoEm: null,
  clienteRespondidoEm: null,
  clienteComentario: null,
};

const ARQUIVOS: ArquivoProjetoExecucao[] = [
  {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
    grupoId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    tarefaId: TAREFA.id,
    versao: 2,
    titulo: 'Mapa de demanda',
    descricao: 'Versão consolidada.',
    nomeOriginal: 'mapa-v2.pdf',
    mimeType: 'application/pdf',
    tamanhoBytes: 240000,
    visivelCliente: false,
    publicadoEm: null,
    criadoEm: '2026-08-09T12:00:00.000Z',
  },
  {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
    grupoId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    tarefaId: TAREFA.id,
    versao: 1,
    titulo: 'Mapa de demanda',
    descricao: null,
    nomeOriginal: 'mapa-v1.pdf',
    mimeType: 'application/pdf',
    tamanhoBytes: 180000,
    visivelCliente: true,
    publicadoEm: '2026-08-08T12:00:00.000Z',
    criadoEm: '2026-08-08T11:00:00.000Z',
  },
];

describe('CentralArquivos', () => {
  it('mantém o envio fechado até o profissional decidir adicionar o primeiro arquivo', async () => {
    const user = userEvent.setup();
    render(
      <CentralArquivos
        projetoId="11111111-1111-4111-8111-111111111111"
        tarefas={[TAREFA]}
        arquivos={[]}
        eventos={[]}
        concluido={false}
      />,
    );

    expect(screen.queryByRole('heading', { name: 'Guardar um arquivo' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Adicionar primeiro arquivo' }));
    expect(screen.getByRole('heading', { name: 'Guardar um arquivo' })).toBeVisible();
  });

  it('preserva o histórico e permite trocar a versão liberada ao cliente', async () => {
    const user = userEvent.setup();
    render(
      <CentralArquivos
        projetoId="11111111-1111-4111-8111-111111111111"
        tarefas={[TAREFA]}
        arquivos={ARQUIVOS}
        eventos={[]}
        concluido={false}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Mapa de demanda' })).toBeVisible();
    expect(screen.getByText('v1 no portal')).toBeVisible();
    expect(screen.getByText('mapa-v2.pdf')).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Guardar um arquivo' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Adicionar arquivo' }));
    expect(screen.getByRole('heading', { name: 'Guardar um arquivo' })).toBeVisible();

    await user.click(screen.getAllByRole('button', { name: 'Liberar no portal' })[0]!);
    await waitFor(() =>
      expect(definirVisibilidade).toHaveBeenCalledWith({
        projeto: '11111111-1111-4111-8111-111111111111',
        arquivo: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
        visivel: true,
      }),
    );
    expect(refresh).toHaveBeenCalled();
  });
});
