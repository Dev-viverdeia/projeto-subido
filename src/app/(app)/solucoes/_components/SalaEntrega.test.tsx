import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ProjetoExecucaoCompleto } from '@/lib/projetos-execucao/queries';

vi.mock('@/lib/projetos-execucao/actions', () => ({
  atualizarTarefaProjeto: vi.fn(),
  configurarPortalCliente: vi.fn(),
  definirPrazoProjeto: vi.fn(),
  prepararEntregaCliente: vi.fn(),
  definirVisibilidadeArquivoProjeto: vi.fn(),
  excluirArquivoProjeto: vi.fn(),
  registrarArquivoProjeto: vi.fn(),
}));

vi.mock('@/lib/projetos-execucao/plano-actions', () => ({ atualizarAcaoPlano: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { SalaEntrega } from './SalaEntrega';

const DOCUMENTO: ProjetoExecucaoCompleto['documento'] = {
  cliente: { empresa: 'Clínica Aurora', contato: null, cargo: null, email: null },
  projeto: {
    titulo: 'Atendimento com IA',
    resumo: 'Uma operação de atendimento validada.',
    origem: 'catalogo',
  },
  desafio: 'A clínica perde conversas fora do horário comercial.',
  objetivo: 'Responder rapidamente e transferir com contexto para a recepção.',
  escopo: [{ titulo: 'Agente', descricao: 'Construção e testes do atendimento.' }],
  entregaveis: ['Agente configurado'],
  cronograma: [{ fase: 'Construir', duracao: '1 semana', descricao: 'Configurar e testar.' }],
  investimento: { valorCentavos: 1000000, condicoes: 'À vista.' },
  validadeDias: 10,
  proximosPassos: ['Kick-off'],
  observacoes: null,
};

const PROJETO: ProjetoExecucaoCompleto = {
  id: '11111111-1111-4111-8111-111111111111',
  propostaId: '22222222-2222-4222-8222-222222222222',
  oportunidadeId: '33333333-3333-4333-8333-333333333333',
  titulo: 'Atendimento com IA',
  empresa: 'Clínica Aurora',
  status: 'em_execucao',
  inicioEm: '2026-08-01T12:00:00.000Z',
  prazoEm: null,
  atualizadoEm: '2026-08-09T12:00:00.000Z',
  feitas: 1,
  total: 3,
  proximaTarefa: 'Montar a base',
  portalAtivo: false,
  portalCodigo: '44444444-4444-4444-8444-444444444444',
  portalAtivadoEm: null,
  arquivos: [],
  eventos: [],
  acoesPlano: [],
  documento: DOCUMENTO,
  tarefas: [
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      faseId: 'entender',
      faseTitulo: 'Entender',
      passoId: '1',
      titulo: 'Mapear demanda',
      acao: 'Leia as conversas reais.',
      concluidoQuando: 'O mapa está pronto.',
      entregavel: 'Mapa de demanda.',
      ordem: 1,
      status: 'concluida',
      evidencia: 'Mapa aprovado.',
      evidenciaEm: null,
      concluidaEm: null,
      clienteStatus: 'nao_solicitada',
      clienteNota: null,
      entregavelUrl: null,
      clienteSolicitadoEm: null,
      clienteRespondidoEm: null,
      clienteComentario: null,
    },
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
      faseId: 'preparar',
      faseTitulo: 'Preparar',
      passoId: '2',
      titulo: 'Montar a base',
      acao: 'Organize as respostas aprovadas.',
      concluidoQuando: 'Dez respostas estão aprovadas.',
      entregavel: 'Base versionada.',
      ordem: 1001,
      status: 'em_andamento',
      evidencia: '',
      evidenciaEm: null,
      concluidaEm: null,
      clienteStatus: 'nao_solicitada',
      clienteNota: null,
      entregavelUrl: null,
      clienteSolicitadoEm: null,
      clienteRespondidoEm: null,
      clienteComentario: null,
    },
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
      faseId: 'entregar',
      faseTitulo: 'Entregar',
      passoId: '3',
      titulo: 'Treinar a equipe',
      acao: 'Conduza o treinamento.',
      concluidoQuando: 'A equipe opera sem ajuda.',
      entregavel: 'Manual final.',
      ordem: 2001,
      status: 'pendente',
      evidencia: null,
      evidenciaEm: null,
      concluidaEm: null,
      clienteStatus: 'nao_solicitada',
      clienteNota: null,
      entregavelUrl: null,
      clienteSolicitadoEm: null,
      clienteRespondidoEm: null,
      clienteComentario: null,
    },
  ],
};

describe('SalaEntrega', () => {
  it('abre na próxima tarefa e permite navegar entre as fases', async () => {
    const user = userEvent.setup();
    render(<SalaEntrega projeto={PROJETO} />);

    expect(screen.getByRole('heading', { name: 'Montar a base', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('33%')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Entregar/ }));
    expect(screen.getByRole('heading', { name: 'Treinar a equipe', level: 2 })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Entender/ }));
    expect(screen.getByRole('textbox', { name: /Evidência da execução/i })).toHaveValue(
      'Mapa aprovado.',
    );
  });

  it('leva o profissional da tarefa revisada para a próxima ação real', async () => {
    const user = userEvent.setup();
    render(<SalaEntrega projeto={PROJETO} />);

    await user.click(screen.getByRole('button', { name: /Entender/ }));
    expect(screen.getByRole('heading', { name: 'Mapear demanda', level: 2 })).toBeVisible();

    await user.click(screen.getByRole('button', { name: /Próxima tarefa Montar a base/i }));
    expect(screen.getByRole('heading', { name: 'Montar a base', level: 2 })).toBeVisible();
  });

  it('mantém os compromissos da call separados das tarefas do método', () => {
    render(
      <SalaEntrega
        projeto={{
          ...PROJETO,
          acoesPlano: [
            {
              id: '55555555-5555-4555-8555-555555555555',
              titulo: 'Enviar os acessos combinados na call',
              prazoEm: '2026-08-12T12:00:00.000Z',
              status: 'pendente',
              origem: 'call',
              reuniaoId: '66666666-6666-4666-8666-666666666666',
              concluidaEm: null,
              atualizadoEm: '2026-08-09T12:00:00.000Z',
            },
          ],
        }}
      />,
    );

    const tarefaAtual = screen.getByRole('heading', { name: 'Montar a base', level: 2 });
    const planoVivo = screen.getByRole('region', { name: 'O combinado segue com o cliente' });
    expect(planoVivo).toBeInTheDocument();
    expect(tarefaAtual.compareDocumentPosition(planoVivo) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(screen.getAllByText('Enviar os acessos combinados na call')).toHaveLength(2);
    expect(tarefaAtual).toBeInTheDocument();
  });

  it('transforma a última entrega concluída em aceite final do projeto', async () => {
    const user = userEvent.setup();
    render(
      <SalaEntrega
        projeto={{
          ...PROJETO,
          feitas: 3,
          total: 3,
          status: 'em_validacao',
          portalAtivo: true,
          tarefas: PROJETO.tarefas.map((tarefa) => ({
            ...tarefa,
            status: 'concluida' as const,
            evidencia: tarefa.evidencia || 'Entrega comprovada.',
          })),
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Entregar/ }));

    expect(screen.getByText('Aceite final pronto para envio')).toBeVisible();
    expect(screen.getByRole('button', { name: /Solicitar aceite final/i })).toBeVisible();
  });

  it('abre o aceite final pela ação principal quando todas as tarefas terminaram', async () => {
    const user = userEvent.setup();
    render(
      <SalaEntrega
        projeto={{
          ...PROJETO,
          feitas: 3,
          total: 3,
          status: 'em_validacao',
          portalAtivo: true,
          tarefas: PROJETO.tarefas.map((tarefa) => ({
            ...tarefa,
            status: 'concluida' as const,
            evidencia: tarefa.evidencia || 'Entrega comprovada.',
          })),
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Formalizar a entrega final/i }));
    expect(screen.getByText('Aceite final pronto para envio')).toBeVisible();
  });
});
