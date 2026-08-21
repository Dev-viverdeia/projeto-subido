import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DocumentoProposta } from '@/lib/propostas/schema';
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

afterEach(cleanup);

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
        documento={DOCUMENTO}
        titulo="Plano comercial da Clínica Aurora"
        versao={2}
        status="rascunho"
        sujo
      />,
    );

    const preview = within(screen.getByLabelText('Prévia visual da proposta'));

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

describe('EditorProposta', () => {
  it('reflete as alterações na prévia antes de salvar', async () => {
    const user = userEvent.setup();

    render(
      <EditorProposta
        id="11111111-1111-4111-8111-111111111111"
        tituloInicial="Plano comercial da Clínica Aurora"
        documentoInicial={DOCUMENTO}
        statusInicial="rascunho"
        versaoInicial={2}
        oportunidadeId="22222222-2222-4222-8222-222222222222"
        reuniaoId={null}
        execucaoId={null}
        compartilhamentoInicial={{
          codigo: null,
          ativo: false,
          compartilhadaEm: null,
          primeiraVisualizacaoEm: null,
          ultimaVisualizacaoEm: null,
          visualizacoes: 0,
          decisaoNome: null,
          decisaoEmail: null,
          decisaoComentario: null,
          decididaEm: null,
        }}
        siteUrl="https://projeto-subido.vercel.app"
      />,
    );

    const preview = within(screen.getByLabelText('Prévia visual da proposta'));

    await user.clear(screen.getByLabelText('Título interno da proposta'));
    await user.type(screen.getByLabelText('Título interno da proposta'), 'Proposta Aurora 2026');
    expect(preview.getByText('Proposta Aurora 2026')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Empresa'));
    await user.type(screen.getByLabelText('Empresa'), 'Aurora Saúde');
    expect(preview.getByText('Aurora Saúde')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Resumo da solução'));
    await user.type(
      screen.getByLabelText('Resumo da solução'),
      'Resumo atualizado sem precisar salvar.',
    );
    expect(preview.getByText('Resumo atualizado sem precisar salvar.')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Descrição da fase 1'));
    await user.type(screen.getByLabelText('Descrição da fase 1'), 'Nova entrega da primeira fase.');
    expect(preview.getByText('Nova entrega da primeira fase.')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Próximo passo 1'));
    await user.type(screen.getByLabelText('Próximo passo 1'), 'Validar escopo com a diretoria');
    expect(preview.getByText('Validar escopo com a diretoria')).toBeInTheDocument();

    await user.clear(screen.getByLabelText(/Observações finais/));
    await user.type(
      screen.getByLabelText(/Observações finais/),
      'Observação atualizada na mesma hora.',
    );
    expect(preview.getByText('Observação atualizada na mesma hora.')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Valor do projeto (R$)'));
    await user.type(screen.getByLabelText('Valor do projeto (R$)'), '29990,00');
    expect(preview.getByText((conteudo) => conteudo.includes('29.990,00'))).toBeInTheDocument();
    expect(preview.getByText('Alterações locais')).toBeInTheDocument();
  }, 10_000);
});
