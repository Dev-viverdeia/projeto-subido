import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DocumentoProposta } from '@/lib/propostas/schema';
import type { StatusProposta } from '@/lib/propostas/queries';
import { salvarProposta, mudarStatusProposta, type EstadoProposta } from '@/lib/propostas/actions';
import { EditorProposta } from './EditorProposta';
import { PreviewProposta } from './PreviewProposta';

vi.mock('server-only', () => ({}));

vi.mock('@/lib/propostas/actions', () => ({
  salvarProposta: vi.fn(() => Promise.resolve({ sucesso: 'Proposta salva.' })),
  mudarStatusProposta: vi.fn(() => Promise.resolve({ sucesso: 'Status atualizado.' })),
}));

vi.mock('@/lib/projetos-execucao/actions', () => ({
  iniciarProjetoExecucao: vi.fn(() => Promise.resolve({ sucesso: 'Projeto criado.' })),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const DOCUMENTO: DocumentoProposta = {
  cliente: {
    empresa: 'Clínica Aurora',
    contato: 'Marina Lopes',
    cargo: 'Diretora de operações',
    email: 'marina@clinicaaurora.com.br',
  },
  projeto: {
    titulo: 'Atendimento inteligente com IA',
    resumo: 'Uma operação de atendimento que responde, qualifica e encaminha cada conversa.',
    origem: 'catalogo',
  },
  desafio: 'A equipe perde oportunidades porque o primeiro atendimento demora e não tem padrão.',
  objetivo: 'Responder mais rápido e transformar conversas em oportunidades qualificadas.',
  escopo: Array.from({ length: 6 }, (_, indice) => ({
    titulo: `Etapa de escopo ${indice + 1}`,
    descricao: `Descrição completa da etapa de escopo ${indice + 1}.`,
  })),
  entregaveis: Array.from({ length: 7 }, (_, indice) => `Entregável completo ${indice + 1}`),
  cronograma: Array.from({ length: 6 }, (_, indice) => ({
    fase: `Fase ${indice + 1}`,
    duracao: `${indice + 1} semana(s)`,
    descricao: `Resultado esperado da fase ${indice + 1}.`,
  })),
  investimento: {
    valorCentavos: 1_500_000,
    condicoes: '50% na contratação e 50% após a validação.',
  },
  validadeDias: 15,
  proximosPassos: ['Aprovar a proposta', 'Agendar o kick-off'],
  observacoes: 'Ferramentas contratadas pelo cliente não estão incluídas.',
};

describe('PreviewProposta', () => {
  it('mostra o documento inteiro, sem ocultar os últimos itens editáveis', () => {
    render(
      <PreviewProposta
        referenciaEm="2026-09-06T02:30:00.000Z"
        documento={DOCUMENTO}
        titulo="Plano comercial da Clínica Aurora"
        versao={2}
        status="rascunho"
        sujo
      />,
    );

    const preview = within(screen.getByLabelText('Prévia visual da proposta'));

    expect(preview.getByText('05 de setembro de 2026')).toBeInTheDocument();
    expect(preview.getByText('Marina Lopes · Diretora de operações')).toBeInTheDocument();
    expect(preview.getByText('marina@clinicaaurora.com.br')).toBeInTheDocument();
    expect(preview.getByText(DOCUMENTO.projeto.resumo)).toBeInTheDocument();
    expect(preview.getByText('Etapa de escopo 6')).toBeInTheDocument();
    expect(preview.getByText('Entregável completo 7')).toBeInTheDocument();
    expect(preview.getByText('Resultado esperado da fase 6.')).toBeInTheDocument();
    expect(preview.getByText('Agendar o kick-off')).toBeInTheDocument();
    expect(preview.getByText(DOCUMENTO.observacoes!)).toBeInTheDocument();
  });
});

function montarEditor(alteracaoInicial = false, statusInicial: StatusProposta = 'rascunho') {
  render(
    <EditorProposta
      referenciaEm="2026-09-06T02:30:00.000Z"
      id="11111111-1111-4111-8111-111111111111"
      tituloInicial="Plano comercial da Clínica Aurora"
      documentoInicial={DOCUMENTO}
      statusInicial={statusInicial}
      versaoInicial={2}
      oportunidadeId="22222222-2222-4222-8222-222222222222"
      reuniaoId={null}
      execucaoId={null}
      alteracaoInicial={alteracaoInicial}
      compartilhamentoInicial={{
        codigo: statusInicial === 'apresentada' ? '44444444-4444-4444-8444-444444444444' : null,
        ativo: statusInicial === 'apresentada',
        compartilhadaEm: null,
        primeiraVisualizacaoEm: null,
        ultimaVisualizacaoEm: null,
        visualizacoes: 0,
        decisaoNome: null,
        decisaoEmail: null,
        decisaoComentario: null,
        decididaEm: null,
      }}
      siteUrl="https://subido.viverdeia.ai"
    />,
  );
  return within(screen.getByLabelText('Prévia visual da proposta'));
}

function alterar(rotulo: string | RegExp, valor: string) {
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } });
}

describe('EditorProposta', () => {
  it('registra uma resposta externa somente após abrir a ação e confirmar', async () => {
    const user = userEvent.setup();
    montarEditor(false, 'apresentada');
    expect(
      screen.getByRole('button', { name: 'Confirmar venda e abrir entrega', hidden: true }),
    ).not.toBeVisible();
    await user.click(screen.getByText('Registrar resposta', { exact: true }));
    expect(mudarStatusProposta).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Registrar como não aprovada' }));
    const dados = vi.mocked(mudarStatusProposta).mock.calls[0]![1];
    expect(dados.get('id')).toBe('11111111-1111-4111-8111-111111111111');
    expect(dados.get('status')).toBe('recusada');
  });

  it('impede registrar a decisão enquanto houver alterações não salvas', async () => {
    const user = userEvent.setup();
    montarEditor(true, 'apresentada');
    await user.click(screen.getByText('Registrar resposta', { exact: true }));
    expect(screen.getByRole('button', { name: 'Confirmar venda e abrir entrega' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Copiar link' })).toBeDisabled();
    expect(mudarStatusProposta).not.toHaveBeenCalled();
  });

  it('atualiza todos os campos da prévia, inclusive os últimos itens e o link opcional', () => {
    const preview = montarEditor();
    const campos: [string | RegExp, string, string?][] = [
      ['Nome da proposta', 'Proposta Aurora 2026'],
      ['Empresa', 'Aurora Saúde'],
      ['Contato', 'Beatriz Souza'],
      ['Cargo', 'Responsável pelo projeto'],
      ['E-mail', 'beatriz@aurora.example'],
      ['Desafio identificado', 'O atendimento precisa de uma fila única.'],
      ['Objetivo do projeto', 'Centralizar os contatos e medir o tempo de resposta.'],
      ['Nome do projeto', 'Assistente de triagem'],
      ['Resumo da solução', 'Um fluxo simples para a equipe trabalhar.'],
      ['Título da etapa 6', 'Treinamento da equipe'],
      ['Descrição da etapa 6', 'Prática com casos reais aprovados.'],
      ['Entregável 7', 'Manual do atendimento'],
      ['Fase 6', 'Revisão assistida'],
      ['Duração da fase 6', 'Quatro dias úteis'],
      ['Descrição da fase 6', 'A equipe testa o fluxo acompanhada.'],
      ['Valor do projeto (R$)', '29990,00', '29.990,00'],
      ['Validade da proposta (dias)', '30', '30 dias'],
      ['Condições de pagamento', 'Entrada e duas parcelas iguais.'],
      [/Link de pagamento desta proposta/, 'https://checkout.example/projeto-atualizado'],
      ['Próximo passo 2', 'Validar escopo com a diretoria'],
      [/Observações finais/, 'Licenças não incluídas no valor.'],
    ];
    for (const [rotulo, valor, esperado] of campos) {
      alterar(rotulo, valor);
      expect(preview.getByText((texto) => texto.includes(esperado ?? valor))).toBeInTheDocument();
    }
    expect(preview.getByText('Alterações não salvas')).toBeInTheDocument();
    expect(salvarProposta).not.toHaveBeenCalled();

    alterar(/Link de pagamento desta proposta/, '');
    alterar(/Observações finais/, '');
    expect(preview.queryByText('Link após aprovação')).not.toBeInTheDocument();
    expect(preview.queryByText('Licenças não incluídas no valor.')).not.toBeInTheDocument();
  });

  it('reflete inclusão e remoção das quatro listas sem precisar salvar', () => {
    const preview = montarEditor();
    const listas: [string, string, string][] = [
      ['Adicionar etapa ao escopo', 'Nova etapa', 'Remover etapa 7'],
      ['Adicionar entregável', 'Novo entregável', 'Remover entregável 8'],
      ['Adicionar fase ao cronograma', 'Nova fase', 'Remover fase 7'],
      ['Adicionar próximo passo', 'Novo próximo passo', 'Remover próximo passo 3'],
    ];
    for (const [adicionar, texto, remover] of listas) {
      fireEvent.click(screen.getByRole('button', { name: adicionar, hidden: true }));
      expect(preview.getByText(texto)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: remover, hidden: true }));
      expect(preview.queryByText(texto)).not.toBeInTheDocument();
    }
    expect(preview.getByText('Versão salva')).toBeInTheDocument();
  });

  it('mantém pendente o que foi digitado durante o salvamento', async () => {
    const user = userEvent.setup();
    let concluir!: (resultado: EstadoProposta) => void;
    const salvamento = new Promise<EstadoProposta>((resolve) => {
      concluir = resolve;
    });
    vi.mocked(salvarProposta).mockReturnValueOnce(salvamento);
    const preview = montarEditor();
    alterar('Nome da proposta', 'Versão enviada para salvar');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(screen.getAllByRole('button', { name: 'Salvando' })[0]).toBeDisabled();
    expect(vi.mocked(salvarProposta).mock.calls[0]?.[1].get('titulo')).toBe(
      'Versão enviada para salvar',
    );

    alterar('Nome da proposta', 'Alteração feita durante a espera');
    await act(async () => {
      concluir({ sucesso: 'Proposta salva.', versao: 3, status: 'rascunho' });
      await salvamento;
    });

    expect(preview.getByText('Alteração feita durante a espera')).toBeInTheDocument();
    expect(preview.getByText('Alterações não salvas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeEnabled();
    expect(screen.queryByRole('link', { name: 'PDF' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(preview.getByText('Versão salva')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'PDF' })).toBeInTheDocument();
  });

  it('preserva a edição após erro e permite tentar salvar novamente', async () => {
    vi.mocked(salvarProposta).mockResolvedValueOnce({ erro: 'Não foi possível salvar agora.' });
    const user = userEvent.setup();
    const preview = montarEditor();
    alterar('Empresa', 'Aurora revisada');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(await screen.findByText('Não foi possível salvar agora.')).toBeInTheDocument();
    expect(preview.getByText('Aurora revisada')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeEnabled();
    expect(preview.getByText('Alterações não salvas')).toBeInTheDocument();
  });

  it('reconhece quando uma alteração é desfeita e quando há dados iniciais pendentes', () => {
    const preview = montarEditor();
    alterar('Empresa', 'Nome temporário');
    alterar('Empresa', DOCUMENTO.cliente.empresa);
    expect(preview.getByText('Versão salva')).toBeInTheDocument();
    cleanup();
    montarEditor(true);
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeEnabled();
  });
});
