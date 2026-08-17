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
      resumo: 'Escolha o que dominar e vender',
      marco: 'Oferta inicial definida',
      contexto:
        'A base não termina em conteúdo assistido. Ela termina quando você consegue nomear o cliente, o problema e a primeira entrega que vai vender.',
      guia: 'Como transformar aprendizado em serviço',
      passos: [
        passo(
          'projeto-inicial',
          'Escolher o primeiro projeto',
          'Selecione uma entrega padrão para estudar, explicar e implementar antes de ampliar o portfólio.',
          projetoEscolhido
            ? `${sinais.perfil?.projetoInicialTitulo ?? 'Projeto inicial'} registrado como oferta.`
            : 'Projeto inicial ainda não escolhido.',
          projetoEscolhido,
          '/inicio#configuracao-jornada',
          'Escolher projeto inicial',
        ),
        passo(
          'posicionamento',
          'Explicar o serviço em uma frase',
          'Registre para quem é o projeto, qual problema ele resolve e qual mudança observável entrega.',
          posicionamentoDefinido
            ? 'Frase de posicionamento registrada na jornada.'
            : 'Posicionamento ainda não registrado.',
          posicionamentoDefinido,
          '/inicio#configuracao-jornada',
          'Definir posicionamento',
        ),
        passo(
          'formacao-base',
          'Concluir uma formação essencial',
          'Complete uma trilha de base para dominar linguagem, processo e critério antes de prometer uma entrega.',
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
      resumo: 'Transforme uma empresa em conversa',
      marco: 'Descoberta registrada',
      contexto:
        'Prospectar aqui não é acumular contatos. É criar uma oportunidade com contexto, assumir uma próxima ação e conduzir uma descoberta que vire registro.',
      guia: 'Roteiro da primeira conversa comercial',
      passos: [
        passo(
          'primeiro-lead',
          'Criar a primeira oportunidade',
          'Cadastre uma empresa e um contato reais no CRM para concentrar toda a próxima movimentação.',
          sinais.oportunidades.total > 0
            ? `${sinais.oportunidades.total} oportunidade(s) registrada(s) no CRM.`
            : 'Nenhuma oportunidade registrada.',
          sinais.oportunidades.total > 0,
          '/crm',
          'Adicionar primeiro lead',
        ),
        passo(
          'enriquecer-lead',
          'Completar o contexto do lead',
          'Enriqueça somente os dados que ajudam a decidir abordagem, conversa ou entrega e preserve a fonte de cada fato.',
          sinais.oportunidades.enriquecidas > 0
            ? `${sinais.oportunidades.enriquecidas} oportunidade(s) enriquecida(s) com fonte registrada.`
            : 'Nenhum enriquecimento concluído.',
          sinais.oportunidades.enriquecidas > 0,
          '/crm',
          'Enriquecer primeiro lead',
        ),
        passo(
          'proxima-acao',
          'Assumir uma próxima ação',
          'Defina no CRM um verbo concreto e uma data. O lead não pode depender da memória.',
          sinais.oportunidades.comProximaAcao > 0
            ? `${sinais.oportunidades.comProximaAcao} oportunidade(s) com próxima ação.`
            : 'Nenhuma próxima ação registrada.',
          sinais.oportunidades.comProximaAcao > 0,
          '/crm',
          'Definir próxima ação',
        ),
        passo(
          'descoberta',
          'Concluir a descoberta',
          'Use a call vinculada ao CRM para confirmar processo, impacto, restrições e decisão.',
          sinais.calls.descobertasConcluidas > 0
            ? `${sinais.calls.descobertasConcluidas} call(s) de descoberta concluída(s).`
            : 'Nenhuma call de descoberta concluída.',
          sinais.calls.descobertasConcluidas > 0,
          '/calls',
          'Agendar descoberta',
        ),
      ],
    },
    {
      id: 'vender',
      numero: '03',
      titulo: 'Vender',
      resumo: 'Converta fatos em uma decisão',
      marco: 'Primeiro projeto vendido',
      contexto:
        'A venda avança quando a descoberta sustenta um escopo, a proposta é apresentada e a decisão fica registrada. Documento criado sozinho não é venda.',
      guia: 'Como conduzir proposta e decisão',
      passos: [
        passo(
          'proposta-criada',
          'Construir a proposta',
          'Transforme fatos, fronteiras, entregáveis, prazo e investimento em uma proposta vinculada ao lead.',
          sinais.propostas.total > 0
            ? `${sinais.propostas.total} proposta(s) criada(s).`
            : 'Nenhuma proposta criada.',
          sinais.propostas.total > 0,
          '/propostas/nova',
          'Criar proposta',
        ),
        passo(
          'proposta-apresentada',
          'Apresentar a proposta',
          'Conduza a decisão em conversa e registre a apresentação antes do acompanhamento.',
          sinais.propostas.apresentadas > 0
            ? `${sinais.propostas.apresentadas} proposta(s) apresentada(s).`
            : 'Nenhuma proposta marcada como apresentada.',
          sinais.propostas.apresentadas > 0,
          '/propostas',
          'Apresentar proposta',
        ),
        passo(
          'venda-confirmada',
          'Registrar a decisão',
          'Marque a proposta como aceita ou a oportunidade como ganha somente depois da confirmação do cliente.',
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
      resumo: 'Execute com acordo e evidência',
      marco: 'Primeira entrega encerrada',
      contexto:
        'A entrega começa com um kickoff claro e termina com o aceite final do cliente. O projeto padrão ensina o método; o projeto vendido concentra tarefas, evidências e decisões reais.',
      guia: 'Como conduzir uma implementação guiada',
      passos: [
        passo(
          'kickoff',
          'Concluir o kickoff',
          'Confirme objetivo, responsáveis, acessos, fronteiras e critério de sucesso com o cliente.',
          sinais.calls.kickoffsConcluidos > 0 || entregaConcluida
            ? `${sinais.calls.kickoffsConcluidos} kickoff(s) concluído(s).`
            : 'Nenhum kickoff concluído.',
          sinais.calls.kickoffsConcluidos > 0 || entregaConcluida,
          '/calls',
          'Agendar kickoff',
        ),
        passo(
          'executar-projeto-cliente',
          'Executar o projeto vendido',
          'Use o projeto do cliente para organizar tarefas, evidências, arquivos, decisões e validações sem separar o método da operação real.',
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
          'Publique as evidências no portal, registre ajustes solicitados e encerre somente depois da aprovação explícita da entrega final.',
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
      resumo: 'Repita o método com mais precisão',
      marco: 'Segundo ciclo comprovado',
      contexto:
        'Escala começa quando a primeira experiência vira repertório e o método consegue produzir uma segunda venda sem apagar as evidências da anterior.',
      guia: 'Como transformar experiência em método',
      passos: [
        passo(
          'segunda-venda',
          'Confirmar o segundo projeto',
          'Use o aprendizado da primeira entrega para qualificar, vender e registrar um novo projeto com menos improviso.',
          segundaVenda
            ? 'Segundo projeto confirmado na operação.'
            : 'Segundo projeto ainda não confirmado.',
          segundaVenda,
          '/crm',
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
