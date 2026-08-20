export type IdEtapaJornada = 'aprender' | 'prospectar' | 'vender' | 'entregar' | 'evoluir';

export type PerfilJornada = {
  nicho: string;
  projetoInicialId: string | null;
  projetoInicialTitulo: string | null;
  projetoInicialSlug: string | null;
  posicionamento: string;
  atualizadoEm: string;
} | null;

export type SinaisJornada = {
  perfil: PerfilJornada;
  aprendizado: {
    aulasConcluidas: number;
    formacoesConcluidas: number;
    etapasConcluidas: number;
    projetosConcluidos: number;
  };
  oportunidades: {
    total: number;
    enriquecidas: number;
    comProximaAcao: number;
    ganhas: number;
  };
  calls: {
    descobertasConcluidas: number;
    kickoffsConcluidos: number;
    entregasConcluidas: number;
  };
  propostas: {
    total: number;
    apresentadas: number;
    aceitas: number;
  };
  entregas: {
    projetosIniciados: number;
    projetosConcluidos: number;
    propostaAceitaEmFocoId: string | null;
    projetoEmFocoId: string | null;
    projetoEmFocoTitulo: string | null;
    tarefasConcluidas: number;
    tarefasTotal: number;
  };
};

export type PassoJornada = {
  id: string;
  titulo: string;
  detalhe: string;
  evidencia: string;
  concluido: boolean;
  destino: string;
  acao: string;
};

export type EtapaJornada = {
  id: IdEtapaJornada;
  numero: string;
  titulo: string;
  resumo: string;
  marco: string;
  contexto: string;
  guia: string;
  passos: PassoJornada[];
  concluidos: number;
  status: 'concluida' | 'atual' | 'futura';
};

export type PlanoJornada = {
  etapaAtual: IdEtapaJornada;
  etapas: EtapaJornada[];
  proximoPasso: PassoJornada;
  evidenciasConcluidas: number;
  totalEvidencias: number;
  percentual: number;
  perfilCompleto: boolean;
};

type DefinicaoEtapa = Omit<EtapaJornada, 'passos' | 'concluidos' | 'status'> & {
  passos: PassoJornada[];
};

function passo(
  id: string,
  titulo: string,
  detalhe: string,
  evidencia: string,
  concluido: boolean,
  destino: string,
  acao: string,
): PassoJornada {
  return { id, titulo, detalhe, evidencia, concluido, destino, acao };
}

function quantidade(valor: number, singular: string, plural: string): string {
  return `${valor} ${valor === 1 ? singular : plural}`;
}

function criarEtapas(sinais: SinaisJornada): DefinicaoEtapa[] {
  const projetoEscolhido = Boolean(sinais.perfil?.projetoInicialId);
  const posicionamentoDefinido = Boolean(sinais.perfil?.posicionamento.trim());
  const vendaConfirmada = sinais.propostas.aceitas > 0 || sinais.oportunidades.ganhas > 0;
  const segundaVenda = Math.max(sinais.propostas.aceitas, sinais.oportunidades.ganhas) >= 2;
  const entregaConcluida = sinais.entregas.projetosConcluidos > 0;
  const tarefasDaEntregaConcluidas =
    entregaConcluida ||
    (sinais.entregas.tarefasTotal > 0 &&
      sinais.entregas.tarefasConcluidas === sinais.entregas.tarefasTotal);
  const destinoDaEntrega = sinais.entregas.projetoEmFocoId
    ? `/solucoes/execucao/${sinais.entregas.projetoEmFocoId}`
    : sinais.entregas.propostaAceitaEmFocoId
      ? `/propostas/${sinais.entregas.propostaAceitaEmFocoId}`
      : '/propostas';

  return [
    {
      id: 'aprender',
      numero: '01',
      titulo: 'Aprender',
      resumo: 'Escolha o que aprender e vender',
      marco: 'Oferta inicial definida',
      contexto:
        'Escolha um mercado, um projeto e uma forma simples de explicar o serviço antes de começar a prospectar.',
      guia: 'Como preparar sua primeira oferta',
      passos: [
        passo(
          'projeto-inicial',
          'Escolher o primeiro projeto',
          'Escolha um projeto padrão para estudar, apresentar e implementar primeiro.',
          projetoEscolhido
            ? `${sinais.perfil?.projetoInicialTitulo ?? 'Projeto inicial'} escolhido como primeira oferta.`
            : 'Projeto inicial ainda não escolhido.',
          projetoEscolhido,
          '/inicio#configuracao-jornada',
          'Escolher projeto inicial',
        ),
        passo(
          'posicionamento',
          'Explicar o serviço em uma frase',
          'Escreva para quem é o projeto, qual problema ele resolve e qual resultado o cliente espera.',
          posicionamentoDefinido
            ? 'Apresentação do serviço salva.'
            : 'Posicionamento ainda não registrado.',
          posicionamentoDefinido,
          '/inicio#configuracao-jornada',
          'Definir posicionamento',
        ),
        passo(
          'formacao-base',
          'Concluir uma formação essencial',
          'Conclua uma formação ligada ao projeto para entender as ferramentas e o processo de implementação.',
          sinais.aprendizado.formacoesConcluidas > 0
            ? `${quantidade(sinais.aprendizado.formacoesConcluidas, 'formação concluída', 'formações concluídas')} na conta.`
            : sinais.aprendizado.aulasConcluidas > 0
              ? `${quantidade(sinais.aprendizado.aulasConcluidas, 'aula concluída', 'aulas concluídas')}; a formação ainda está em andamento.`
              : 'Nenhuma aula concluída ainda.',
          sinais.aprendizado.formacoesConcluidas > 0,
          '/formacoes',
          'Continuar formação',
        ),
      ],
    },
    {
      id: 'prospectar',
      numero: '02',
      titulo: 'Prospectar',
      resumo: 'Encontre empresas e inicie conversas',
      marco: 'Descoberta registrada',
      contexto:
        'Encontre empresas, faça a primeira abordagem e leve para Vendas quem responder ou demonstrar interesse.',
      guia: 'Como fazer a primeira abordagem',
      passos: [
        passo(
          'primeiro-lead',
          'Registrar a primeira venda',
          'Adicione em Vendas uma empresa com quem você quer conversar.',
          sinais.oportunidades.total > 0
            ? `${quantidade(sinais.oportunidades.total, 'venda registrada', 'vendas registradas')} em Vendas.`
            : 'Nenhuma venda registrada.',
          sinais.oportunidades.total > 0,
          '/vendas',
          'Adicionar primeiro cliente',
        ),
        passo(
          'enriquecer-lead',
          'Pesquisar o lead',
          'Busque site, informações da empresa e dados do contato antes da primeira conversa.',
          sinais.oportunidades.enriquecidas > 0
            ? `${quantidade(sinais.oportunidades.enriquecidas, 'cliente pesquisado', 'clientes pesquisados')} com fontes salvas.`
            : 'Nenhum enriquecimento concluído.',
          sinais.oportunidades.enriquecidas > 0,
          '/vendas',
          'Pesquisar primeiro cliente',
        ),
        passo(
          'proxima-acao',
          'Definir a próxima ação',
          'Registre o que você vai fazer e a data do próximo contato.',
          sinais.oportunidades.comProximaAcao > 0
            ? `${quantidade(sinais.oportunidades.comProximaAcao, 'venda com próxima ação', 'vendas com próxima ação')}.`
            : 'Nenhuma próxima ação registrada.',
          sinais.oportunidades.comProximaAcao > 0,
          '/vendas',
          'Definir próxima ação',
        ),
        passo(
          'descoberta',
          'Concluir a descoberta',
          'Use uma reunião ligada à ficha do cliente para entender o processo atual, o impacto do problema e quem decide.',
          sinais.calls.descobertasConcluidas > 0
            ? `${quantidade(sinais.calls.descobertasConcluidas, 'reunião de descoberta concluída', 'reuniões de descoberta concluídas')}.`
            : 'Nenhuma reunião de descoberta concluída.',
          sinais.calls.descobertasConcluidas > 0,
          '/reunioes',
          'Agendar descoberta',
        ),
      ],
    },
    {
      id: 'vender',
      numero: '03',
      titulo: 'Vender',
      resumo: 'Apresente a proposta e registre a decisão',
      marco: 'Primeiro projeto vendido',
      contexto:
        'Use o que foi confirmado na reunião para montar a proposta, apresentá-la e acompanhar a decisão do cliente.',
      guia: 'Como apresentar e acompanhar uma proposta',
      passos: [
        passo(
          'proposta-criada',
          'Construir a proposta',
          'Use a ficha do cliente para montar escopo, entregáveis, prazo e investimento.',
          sinais.propostas.total > 0
            ? `${quantidade(sinais.propostas.total, 'proposta criada', 'propostas criadas')}.`
            : 'Nenhuma proposta criada.',
          sinais.propostas.total > 0,
          '/propostas/nova',
          'Criar proposta',
        ),
        passo(
          'proposta-apresentada',
          'Apresentar a proposta',
          'Apresente a proposta em uma reunião e marque a data do próximo contato.',
          sinais.propostas.apresentadas > 0
            ? `${quantidade(sinais.propostas.apresentadas, 'proposta apresentada', 'propostas apresentadas')}.`
            : 'Nenhuma proposta marcada como apresentada.',
          sinais.propostas.apresentadas > 0,
          '/propostas',
          'Apresentar proposta',
        ),
        passo(
          'venda-confirmada',
          'Registrar a decisão',
          'Marque a proposta como aceita ou a venda como ganha somente depois da confirmação do cliente.',
          vendaConfirmada ? 'Primeira venda confirmada na operação.' : 'Nenhuma venda confirmada.',
          vendaConfirmada,
          '/propostas',
          'Registrar decisão',
        ),
      ],
    },
    {
      id: 'entregar',
      numero: '04',
      titulo: 'Entregar',
      resumo: 'Implemente e valide com o cliente',
      marco: 'Primeira entrega encerrada',
      contexto:
        'Comece pelo kickoff, acompanhe as tarefas e peça o aceite do cliente quando a entrega estiver pronta.',
      guia: 'Como conduzir a implementação',
      passos: [
        passo(
          'kickoff',
          'Concluir o kickoff',
          'Confirme objetivo, responsáveis, acessos, fronteiras e critério de sucesso com o cliente.',
          sinais.calls.kickoffsConcluidos > 0 || entregaConcluida
            ? `${quantidade(sinais.calls.kickoffsConcluidos, 'kickoff concluído', 'kickoffs concluídos')}.`
            : 'Nenhum kickoff concluído.',
          sinais.calls.kickoffsConcluidos > 0 || entregaConcluida,
          '/reunioes',
          'Agendar kickoff',
        ),
        passo(
          'executar-projeto-cliente',
          'Executar o projeto vendido',
          'Use o projeto do cliente para acompanhar tarefas, arquivos, decisões e testes.',
          sinais.entregas.projetosIniciados === 0
            ? 'Nenhum projeto de cliente foi iniciado.'
            : `${sinais.entregas.projetoEmFocoTitulo ?? 'Projeto em foco'} · ${sinais.entregas.tarefasConcluidas}/${sinais.entregas.tarefasTotal} tarefas concluídas.`,
          tarefasDaEntregaConcluidas,
          destinoDaEntrega,
          sinais.entregas.projetosIniciados > 0 ? 'Continuar projeto' : 'Abrir projeto vendido',
        ),
        passo(
          'aceite-final',
          'Obter o aceite final do cliente',
          'Compartilhe a entrega no portal, registre os ajustes pedidos e encerre depois da aprovação do cliente.',
          entregaConcluida
            ? `${quantidade(sinais.entregas.projetosConcluidos, 'projeto concluído com aceite', 'projetos concluídos com aceite')}.`
            : tarefasDaEntregaConcluidas
              ? 'Todas as tarefas foram concluídas; o aceite final ainda está pendente.'
              : 'A execução ainda não chegou à validação final.',
          entregaConcluida,
          destinoDaEntrega,
          'Revisar aceite final',
        ),
      ],
    },
    {
      id: 'evoluir',
      numero: '05',
      titulo: 'Evoluir',
      resumo: 'Use o que funcionou na próxima venda',
      marco: 'Segundo ciclo comprovado',
      contexto:
        'Depois da primeira entrega, registre o que funcionou e use esse aprendizado para vender e implementar o próximo projeto.',
      guia: 'Como preparar o próximo projeto',
      passos: [
        passo(
          'segunda-venda',
          'Confirmar o segundo projeto',
          'Use o aprendizado da primeira entrega para qualificar, vender e registrar um novo projeto com menos improviso.',
          segundaVenda
            ? 'Segundo projeto confirmado na operação.'
            : 'Segundo projeto ainda não confirmado.',
          segundaVenda,
          '/vendas',
          'Iniciar próximo ciclo',
        ),
      ],
    },
  ];
}

export function montarPlanoJornada(sinais: SinaisJornada): PlanoJornada {
  const definicoes = criarEtapas(sinais);
  const indiceSequencial = definicoes.findIndex((etapa) =>
    etapa.passos.some((item) => !item.concluido),
  );
  const indiceProspectar = definicoes.findIndex((etapa) => etapa.id === 'prospectar');
  const indiceVender = definicoes.findIndex((etapa) => etapa.id === 'vender');
  const indiceEntregar = definicoes.findIndex((etapa) => etapa.id === 'entregar');
  const indiceEvoluir = definicoes.findIndex((etapa) => etapa.id === 'evoluir');
  const vendaConfirmada = sinais.propostas.aceitas > 0 || sinais.oportunidades.ganhas > 0;
  const cicloEntregue = definicoes[indiceEntregar]?.passos.every((item) => item.concluido);

  // A jornada é uma prioridade operacional, não uma trava de curso. Fatos mais
  // avançados levam o profissional ao trabalho em andamento, mesmo que ainda
  // existam evidências educacionais pendentes em etapas anteriores.
  const indiceResolvido = vendaConfirmada
    ? cicloEntregue
      ? indiceEvoluir
      : indiceEntregar
    : sinais.propostas.total > 0
      ? indiceVender
      : sinais.oportunidades.total > 0 || sinais.calls.descobertasConcluidas > 0
        ? indiceProspectar
        : indiceSequencial === -1
          ? definicoes.length - 1
          : indiceSequencial;
  const etapaAtual = definicoes[indiceResolvido]!.id;
  const etapas = definicoes.map((etapa, indice): EtapaJornada => ({
    ...etapa,
    concluidos: etapa.passos.filter((item) => item.concluido).length,
    status: etapa.passos.every((item) => item.concluido)
      ? 'concluida'
      : indice === indiceResolvido
        ? 'atual'
        : 'futura',
  }));
  const todos = etapas.flatMap((etapa) => etapa.passos);
  const evidenciasConcluidas = todos.filter((item) => item.concluido).length;
  const proximoPasso =
    etapas[indiceResolvido]?.passos.find((item) => !item.concluido) ??
    passo(
      'revisar-operacao',
      'Revisar o próximo ciclo',
      'Leve os fatos acumulados para o Sobral AI e escolha onde aumentar qualidade ou previsibilidade.',
      'Primeiro ciclo operacional completo.',
      false,
      '/consultor',
      'Revisar com Sobral AI',
    );

  return {
    etapaAtual,
    etapas,
    proximoPasso,
    evidenciasConcluidas,
    totalEvidencias: todos.length,
    percentual: todos.length ? Math.round((evidenciasConcluidas / todos.length) * 100) : 0,
    perfilCompleto: Boolean(
      sinais.perfil?.nicho.trim() &&
      sinais.perfil.projetoInicialId &&
      sinais.perfil.posicionamento.trim(),
    ),
  };
}
