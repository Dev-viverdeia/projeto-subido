import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { DadosRoteiroProjeto, ItemSolucao } from '@/lib/conteudo/queries';
import type { ProjetoGuiado } from './ProjetoGuiado';

const fases = ['entender', 'preparar', 'construir', 'validar', 'entregar'] as const;

const projeto: DadosRoteiroProjeto = {
  resultado: 'Uma operação completa e validada nas mãos do cliente.',
  clienteIdeal: 'Uma empresa com processo recorrente e um responsável disponível para validar.',
  entregavelFinal: 'Operação ativa, testes, treinamento e manual de acompanhamento.',
  versao: 1,
  roteiro: {
    perfil: {
      nivel: 'intermediario',
      prazo: '2 a 4 semanas',
      formatoPiloto: 'Um processo, uma equipe e uma fonte de dados controlada.',
      primeiraProva: 'Dez casos processados com evidência e aceite do responsável.',
      recomendadoParaComecar: false,
    },
    escopo: {
      inclui: ['Fluxo principal validado', 'Registro das decisões', 'Treinamento do responsável'],
      preRequisitos: ['Processo atual documentado', 'Responsável disponível para validar'],
      naoInclui: ['Decisão autônoma de alto risco', 'Expansão para todos os canais'],
      evolucoes: ['Adicionar novos fluxos depois do piloto'],
    },
    artefatosEntrega: [
      { titulo: 'Mapa do processo', descricao: 'Jornada, estados e responsáveis aprovados.' },
      { titulo: 'Suíte de testes', descricao: 'Casos, resultado esperado, evidência e reteste.' },
      { titulo: 'Manual da operação', descricao: 'Rotina, contingência e revisão da entrega.' },
    ],
    trilhaDidatica: {
      tempoTotal: '30 minutos',
      aulas: [
        {
          titulo: 'Desenhe a conversa',
          objetivo: 'Entender a jornada real e definir onde a automação precisa de uma pessoa.',
          duracao: '10 min',
          topicos: ['Estados e movimentos permitidos', 'Gatilhos para passagem humana'],
          exercicio: 'Mapeie cinco conversas reais e marque a mudança de estado em cada uma.',
          prontoQuando: 'Cada estado tem entrada, saída, responsável e exceção documentados.',
        },
        {
          titulo: 'Valide antes de ativar',
          objetivo: 'Testar respostas e falhas sem expor uma conversa real à automação.',
          duracao: '12 min',
          topicos: ['Cenários comuns e críticos', 'Evidência e reteste antes da ativação'],
          exercicio: 'Rode um cenário comum, um ambíguo e um que exija passagem humana.',
          prontoQuando: 'Todos os cenários deixam evidência e respeitam os limites aprovados.',
        },
      ],
      videosReferencia: [
        {
          titulo: 'Implementação de referência',
          descricao: 'Acompanhe uma implementação equivalente antes de construir a sua entrega.',
          videoUrl: 'https://video.example.com/embed/123',
        },
      ],
      demonstracao: {
        titulo: 'Do contato ao CRM',
        contexto:
          'Um novo lead chega, é qualificado e precisa ser entregue ao vendedor com contexto.',
        passos: [
          {
            etapa: 'Entrada',
            oQueAcontece: 'A mensagem entra na linha do tempo antes da primeira resposta.',
            evidencia: 'Evento com horário',
          },
          {
            etapa: 'Qualificação',
            oQueAcontece: 'As respostas confirmadas viram fatos e as lacunas continuam abertas.',
            evidencia: 'Fatos e campos ausentes',
          },
          {
            etapa: 'Passagem',
            oQueAcontece: 'O vendedor recebe o histórico, a dúvida e a próxima ação sugerida.',
            evidencia: 'Dono e resumo',
          },
          {
            etapa: 'CRM',
            oQueAcontece: 'A linha do tempo mostra o responsável e o próximo passo confirmado.',
            evidencia: 'Evento no CRM',
          },
        ],
        resultadoEsperado:
          'A conversa chega ao vendedor completa e sem informação comercial inventada.',
      },
      materiais: [
        {
          titulo: 'Briefing de atendimento',
          quandoUsar: 'Na primeira reunião para fechar fontes e limites.',
          conteudo: 'Objetivo:\nFontes aprovadas:\nLimites:\nResponsável pela passagem:',
        },
        {
          titulo: 'Matriz de qualificação',
          quandoUsar: 'Antes de escrever o comportamento do agente.',
          conteudo: 'Critério | Pergunta | Evidência | Efeito na rota | Se faltar dado',
        },
        {
          titulo: 'Checklist de ativação',
          quandoUsar: 'No aceite do piloto antes de abrir o canal.',
          conteudo: '[ ] Base aprovada\n[ ] Passagem testada\n[ ] CRM sem duplicidade',
        },
      ],
    },
    fundamentos: [
      {
        titulo: 'Venda a operação',
        descricao: 'O cliente compra um atendimento consistente, seguro e acompanhado por pessoas.',
      },
    ],
    fases: fases.map((id, indice) => ({
      id,
      titulo: id[0]!.toUpperCase() + id.slice(1),
      objetivo: `Objetivo detalhado e verificável da fase de ${id}.`,
      passos: [
        {
          id: `passo-${id}`,
          titulo: indice === 0 ? 'Mapear o cenário atual' : `Executar ${id}`,
          acao: `Execute uma ação suficientemente detalhada na fase ${id}.`,
          concluidoQuando: 'A evidência foi registrada e revisada pelo responsável.',
          entregavel: `Entrega da fase ${id}`,
          duracao: indice === 0 ? '45–60 min' : undefined,
          insumos: indice === 0 ? ['Conversas reais do atendimento'] : [],
          execucao: indice === 0 ? ['Exporte e organize as conversas do período escolhido.'] : [],
          atencao:
            indice === 0
              ? 'Não use uma semana atípica como retrato definitivo da operação.'
              : undefined,
          modelo:
            indice === 0
              ? {
                  titulo: 'Planilha de demanda',
                  conteudo: 'Data | horário | assunto | tempo de primeira resposta | desfecho',
                }
              : undefined,
        },
      ],
    })),
  },
};

function item(id: string, tipo: 'ferramenta' | 'prompt'): ItemSolucao {
  return {
    id,
    solucao_id: 's1',
    tipo,
    ordem: 1,
    titulo: tipo === 'ferramenta' ? 'Supabase' : 'Revisar implantação',
    conteudo: 'Conteúdo pronto para usar na implantação.',
  };
}

type Props = Parameters<typeof ProjetoGuiado>[0];
let Tela: (props: Props) => React.ReactNode;

beforeEach(async () => {
  localStorage.clear();
  vi.resetModules();
  Reflect.defineProperty(Element.prototype, 'scrollIntoView', {
    value: vi.fn(),
    writable: true,
  });
  Tela = (await import('./ProjetoGuiado')).ProjetoGuiado;
});

function montar() {
  return render(
    <Tela
      slug="crm-comercial"
      titulo="CRM Comercial com IA"
      resumo="Um CRM factual para conduzir a venda."
      categoria="Vendas"
      projeto={projeto}
      ferramentas={[item('f1', 'ferramenta')]}
      prompts={[item('p1', 'prompt')]}
      videoUrl={null}
      proxima={null}
    />,
  );
}

describe('Projeto guiado', () => {
  it('mostra uma fase por vez e permite navegar pelas cinco etapas', async () => {
    const user = userEvent.setup();
    montar();

    const navegacao = screen.getByRole('navigation', { name: 'Fases do projeto' });
    expect(within(navegacao).getAllByRole('button')).toHaveLength(5);
    expect(screen.getByRole('heading', { level: 2, name: 'Entender' })).toBeDefined();
    expect(screen.queryByRole('heading', { level: 2, name: 'Preparar' })).toBeNull();
    expect(screen.getByText(projeto.entregavelFinal)).toBeDefined();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Regras que protegem este projeto' }),
    ).toBeDefined();
    expect(
      screen.getByRole('heading', { level: 2, name: 'O combinado deste projeto' }),
    ).toBeDefined();
    expect(screen.getByText('2 a 4 semanas')).toBeDefined();
    expect(screen.getByText('Expansão para todos os canais')).toBeDefined();
    expect(
      screen.getByRole('heading', { level: 3, name: 'O kit que comprova a entrega' }),
    ).toBeDefined();
    expect(screen.getByText('Suíte de testes')).toBeDefined();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Aprenda o necessário. Depois, execute.' }),
    ).toBeDefined();
    expect(screen.getByText('Só o que muda a sua execução')).toBeDefined();
    expect(screen.getByRole('heading', { level: 3, name: 'Do contato ao CRM' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Copiar Briefing de atendimento' })).toBeDefined();
    expect(
      screen.getByRole('button', { name: 'Assistir: Implementação de referência' }),
    ).toBeDefined();
    expect(screen.getByText('Faça nesta ordem')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Copiar Planilha de demanda' })).toBeDefined();
    expect(screen.getAllByText('Próximo passo').length).toBeGreaterThan(0);
    expect(screen.getByRole('progressbar', { name: 'Progresso do projeto' })).toHaveAttribute(
      'aria-valuenow',
      '0',
    );

    await user.click(within(navegacao).getByRole('button', { name: /Preparar/ }));
    expect(screen.getByRole('heading', { level: 2, name: 'Preparar' })).toBeDefined();
    expect(screen.queryByRole('heading', { level: 2, name: 'Entender' })).toBeNull();

    await user.click(within(navegacao).getByRole('button', { name: /Entregar/ }));
    expect(screen.getByRole('link', { name: /Abrir kit de implementação/ })).toHaveAttribute(
      'href',
      '#kit-projeto',
    );
  });

  it('marca o passo e move a retomada para o seguinte', async () => {
    const user = userEvent.setup();
    montar();
    await user.click(screen.getByRole('button', { name: 'Concluir: Mapear o cenário atual' }));
    expect(screen.getByText('1 de 5 passos')).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: 'Preparar' })).toBeDefined();
  });

  it('leva a identidade do projeto ao Estúdio', () => {
    montar();
    expect(screen.getByRole('link', { name: /Personalizar no Estúdio/ })).toHaveAttribute(
      'href',
      '/builder?projeto=crm-comercial',
    );
  });

  it('conecta o projeto ao primeiro lead e à proposta comercial', () => {
    montar();

    expect(screen.getByRole('link', { name: /Cadastrar lead/ })).toHaveAttribute(
      'href',
      '/crm?novo=projeto&projeto=CRM%20Comercial%20com%20IA',
    );
    expect(screen.getByRole('link', { name: /Criar proposta/ })).toHaveAttribute(
      'href',
      '/propostas/nova?projeto=crm-comercial',
    );
    expect(
      screen.getByText('O roteiro entra em campo depois que uma empresa aceita avançar.'),
    ).toBeInTheDocument();
  });

  it('leva para uma nova oportunidade quando a entrega guiada termina', () => {
    const agora = new Date().toISOString();
    const etapas = Object.fromEntries(
      fases.map((fase) => [`projeto:crm-comercial:${fase}:passo-${fase}`, agora]),
    );
    localStorage.setItem(
      'subido_progresso_v1',
      JSON.stringify({ aulas: {}, formacoes: {}, etapas, solucoes: {} }),
    );

    montar();

    expect(screen.getByRole('link', { name: /Encontrar novo cliente/ })).toHaveAttribute(
      'href',
      '/crm?novo=projeto&projeto=CRM%20Comercial%20com%20IA',
    );
  });
});
