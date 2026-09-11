import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ProjetoPortalCliente } from '@/lib/portal-cliente/servico';

vi.mock('@/lib/portal-cliente/actions', () => ({
  decidirEntregaCliente: vi.fn(() => Promise.resolve({})),
  decidirMudancaEscopoCliente: vi.fn(() => Promise.resolve({})),
  concluirPendenciaCliente: vi.fn(() => Promise.resolve({})),
  solicitarMudancaEscopoCliente: vi.fn(() => Promise.resolve({})),
}));

import { PortalProjeto } from './PortalProjeto';
import { decidirEntregaCliente, solicitarMudancaEscopoCliente } from '@/lib/portal-cliente/actions';

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
  encerramento: null,
  evolucao: null,
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

const ENCERRAMENTO: NonNullable<ProjetoPortalCliente['encerramento']> = {
  id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2',
  status: 'aguardando_aceite',
  resumoEntrega: 'Atendimento configurado, testado e entregue à recepção.',
  resultadoPrincipal: 'A primeira resposta ocorreu em menos de um minuto nos testes aprovados.',
  evidenciaResultadoUrl: 'https://example.com/resultado',
  garantiaDias: 30,
  garantiaCobre: 'Correções do fluxo entregue.',
  garantiaNaoCobre: 'Novas funcionalidades.',
  canalSuporte: 'suporte@exemplo.com',
  responsavelContinuidade: 'Camila Rios',
  orientacaoContinuidade: 'Acompanhar as transferências diariamente e registrar qualquer desvio.',
  enviadoEm: '2026-08-10T17:10:00.000Z',
  aceitoEm: null,
  garantiaTerminaEm: null,
};

function abrirDetalhe(rotulo: string) {
  const texto = screen.getByText(rotulo);
  const detalhe = texto.closest('details');
  if (detalhe && !detalhe.open) fireEvent.click(texto);
}

describe('PortalProjeto', () => {
  it('mantém o pedido de mudança preenchido quando o envio falha', async () => {
    vi.mocked(solicitarMudancaEscopoCliente).mockResolvedValueOnce({
      erro: 'Não foi possível confirmar o pedido. Tente novamente.',
    });
    render(<PortalProjeto codigo="44444444-4444-4444-8444-444444444444" projeto={PROJETO} />);
    abrirDetalhe('Sobre o projeto');
    fireEvent.click(screen.getByRole('button', { name: 'Pedir uma mudança' }));
    fireEvent.change(screen.getByLabelText('Resumo do pedido'), {
      target: { value: 'Adicionar novo canal' },
    });
    fireEvent.change(screen.getByLabelText('Explique a necessidade'), {
      target: { value: 'Precisamos atender também pelo Instagram da clínica.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar para análise' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Tente novamente.');
    expect(screen.getByLabelText('Resumo do pedido')).toHaveValue('Adicionar novo canal');
    expect(screen.getByLabelText('Explique a necessidade')).toHaveValue(
      'Precisamos atender também pelo Instagram da clínica.',
    );
    const enviado = vi.mocked(solicitarMudancaEscopoCliente).mock.calls.at(-1)![1];
    expect(enviado.get('codigo')).toBe('44444444-4444-4444-8444-444444444444');
    expect(enviado.get('titulo')).toBe('Adicionar novo canal');
    expect(screen.getByRole('button', { name: 'Enviar para análise' })).toBeEnabled();
  });
  it('abre apenas a primeira revisão e mantém todos os formulários montados', () => {
    const { container } = render(
      <PortalProjeto
        codigo="44444444-4444-4444-8444-444444444444"
        projeto={{
          ...PROJETO,
          tarefas: PROJETO.tarefas.map((tarefa) => ({ ...tarefa, clienteStatus: 'aguardando' })),
        }}
      />,
    );
    const revisoes = screen
      .getByRole('region', { name: '2 itens aguardam sua resposta.' })
      .querySelectorAll('details:has(> summary strong)');
    expect(revisoes).toHaveLength(2);
    expect(revisoes[0]).toHaveAttribute('open');
    expect(revisoes[1]).not.toHaveAttribute('open');
    expect(container.querySelectorAll('button[value="aprovada"]')).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Arquivos' })).toHaveAttribute(
      'href',
      '#arquivos-titulo',
    );
  });
  it('não confunde conclusão do profissional com aprovação do cliente', () => {
    render(
      <PortalProjeto
        codigo="44444444-4444-4444-8444-444444444444"
        projeto={{ ...PROJETO, status: 'concluido', tarefas: [] }}
      />,
    );
    expect(screen.getByText('Entrega registrada pelo profissional')).toBeInTheDocument();
    expect(screen.queryByText('Aceite confirmado')).not.toBeInTheDocument();
    expect(screen.queryByText('Aceite registrado')).not.toBeInTheDocument();
  });
  it('mantém uma aprovação pendente como ação mesmo após conclusão manual', () => {
    render(
      <PortalProjeto
        codigo="44444444-4444-4444-8444-444444444444"
        projeto={{ ...PROJETO, status: 'concluido' }}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Revise esta entrega.' })).toBeInTheDocument();
    expect(screen.queryByText('Aceite confirmado')).not.toBeInTheDocument();
  });
  it('preserva o pedido de ajuste ao voltar e após falha no salvamento', async () => {
    vi.mocked(decidirEntregaCliente).mockResolvedValueOnce({ erro: 'Tente novamente.' });
    render(<PortalProjeto codigo="44444444-4444-4444-8444-444444444444" projeto={PROJETO} />);
    fireEvent.click(screen.getByRole('button', { name: 'Pedir ajuste' }));
    fireEvent.change(screen.getByLabelText('O que precisa mudar?'), {
      target: { value: 'Incluir o caminho de transferência.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Pedir ajuste' }));
    expect(screen.getByLabelText('O que precisa mudar?')).toHaveValue(
      'Incluir o caminho de transferência.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Enviar ajuste' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Resposta não confirmada');
    expect(screen.getByLabelText('O que precisa mudar?')).toHaveValue(
      'Incluir o caminho de transferência.',
    );
    expect(screen.getByRole('button', { name: 'Enviar ajuste' })).toBeEnabled();
  });

  it('confirma que recebeu o ajuste e não comunica conclusão antes do aceite', () => {
    render(
      <PortalProjeto
        codigo="44444444-4444-4444-8444-444444444444"
        projeto={{
          ...PROJETO,
          feitas: 2,
          tarefas: PROJETO.tarefas.map((tarefa, indice) =>
            indice === 1
              ? {
                  ...tarefa,
                  clienteStatus: 'ajustes',
                  comentario: 'Inclua a transferência para a recepção.',
                }
              : tarefa,
          ),
        }}
      />,
    );
    expect(
      screen.getByRole('heading', { name: 'Seu pedido de ajuste foi recebido.' }),
    ).toBeVisible();
    expect(screen.getByText('100%')).toBeVisible();
    expect(screen.getByText('executado', { exact: true })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Projeto concluído.' })).toBeNull();
  });

  it('apresenta junto do aceite somente os arquivos vinculados à tarefa em revisão', () => {
    const arquivoDaEntrega = {
      ...PROJETO.arquivos[0]!,
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
      tarefaId: PROJETO.tarefas[1]!.id,
      titulo: 'Base para revisar',
    };
    render(
      <PortalProjeto
        codigo="44444444-4444-4444-8444-444444444444"
        projeto={{ ...PROJETO, arquivos: [...PROJETO.arquivos, arquivoDaEntrega] }}
      />,
    );
    const materiais = within(screen.getByRole('list', { name: 'Arquivos desta entrega' }));
    expect(materiais.getByRole('link', { name: 'Base para revisar Versão 2' })).toHaveAttribute(
      'href',
      '/portal/44444444-4444-4444-8444-444444444444/arquivos/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
    );
    expect(materiais.queryByRole('link', { name: /Mapa final/ })).toBeNull();
  });
  it('mostra progresso e decisão sem expor o campo de evidência interna', () => {
    render(<PortalProjeto codigo="44444444-4444-4444-8444-444444444444" projeto={PROJETO} />);

    expect(
      screen.getByRole('heading', { name: 'Atendimento inteligente', level: 1 }),
    ).toBeVisible();
    expect(screen.getByText('50%')).toBeVisible();
    expect(screen.getByRole('button', { name: /Aprovar entrega/i })).toBeVisible();
    expect(screen.getByText('Aprovar quando')).toBeVisible();
    expect(
      screen.getByText('As respostas principais têm fonte e aprovação da responsável.'),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: /Baixar/i })).toHaveAttribute(
      'href',
      '/portal/44444444-4444-4444-8444-444444444444/arquivos/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    );
    expect(screen.queryByText(/Evidência da execução/i)).toBeNull();
    abrirDetalhe('Sobre o projeto');
    abrirDetalhe('Histórico');
    expect(screen.getByRole('list', { name: 'Histórico do projeto' })).toBeVisible();
    expect(screen.getByText('Documento aprovado.')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'O que vamos entregar juntos.' })).toBeVisible();
    const decisao = screen.getByRole('heading', { name: 'Revise esta entrega.' });
    expect(screen.getByRole('list', { name: 'Andamento por fase' })).toBeVisible();
    const arquivos = screen.getByRole('heading', { name: /Arquivos do projeto/i });
    expect(decisao.compareDocumentPosition(arquivos) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('abre o campo de ajuste somente quando o cliente escolhe pedir uma correção', () => {
    render(<PortalProjeto codigo="44444444-4444-4444-8444-444444444444" projeto={PROJETO} />);

    expect(screen.queryByRole('textbox', { name: 'O que precisa mudar?' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Pedir ajuste' }));
    expect(screen.getByRole('textbox', { name: 'O que precisa mudar?' })).toBeRequired();
    expect(screen.getByRole('button', { name: 'Enviar ajuste' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Aprovar entrega' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(screen.queryByRole('textbox', { name: 'O que precisa mudar?' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Aprovar entrega' })).toBeVisible();
  });

  it('apresenta o último aceite como encerramento formal do projeto', () => {
    render(
      <PortalProjeto
        codigo="44444444-4444-4444-8444-444444444444"
        projeto={{
          ...PROJETO,
          status: 'em_validacao',
          feitas: 2,
          encerramento: ENCERRAMENTO,
        }}
      />,
    );

    expect(screen.getByText('Aceite final do projeto')).toBeVisible();
    const aprovacao = within(
      screen.getByRole('button', { name: /Aprovar e concluir/i }).closest('article')!,
    );
    expect(aprovacao.getByText('Resultado, garantia e continuidade.')).toBeVisible();
    expect(aprovacao.getByText('30 dias a partir do aceite final')).toBeVisible();
    expect(screen.getByRole('button', { name: /Aprovar e concluir/i })).toBeVisible();
  });

  it('mostra a revisão pós-entrega sem expor notas internas', () => {
    render(
      <PortalProjeto
        codigo="44444444-4444-4444-8444-444444444444"
        projeto={{
          ...PROJETO,
          status: 'concluido',
          feitas: 2,
          encerramento: { ...ENCERRAMENTO, status: 'encerrado' },
          evolucao: {
            id: 'ffffffff-ffff-4fff-8fff-fffffffffff1',
            status: 'registrada',
            revisaoEm: '2026-09-09',
            resultadoObservado: 'A recepção passou a receber cada contato com contexto.',
            evidenciaResultadoUrl: null,
            decisao: 'manter',
            proximoPasso: 'Revisar os indicadores novamente com a responsável.',
            proximoPassoEm: '2026-10-09',
            compartilharCliente: true,
            registradaEm: '2026-09-09T14:00:00.000Z',
            oportunidadeContinuidadeId: null,
          },
        }}
      />,
    );

    abrirDetalhe('Resultados e aceite');
    expect(screen.getByRole('heading', { name: 'O resultado e o próximo passo.' })).toBeVisible();
    expect(
      screen.getByText('A recepção passou a receber cada contato com contexto.'),
    ).toBeVisible();
    expect(screen.getByText('Manter a operação como está')).toBeVisible();
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

    expect(
      screen.getByRole('heading', { name: '1 item precisa da sua confirmação.' }),
    ).toBeVisible();
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
