import type { ProjetoExecucaoCompleto } from '@/lib/projetos-execucao/queries';

export function prepararProjetoNoInicio(projeto: ProjetoExecucaoCompleto): ProjetoExecucaoCompleto {
  return {
    ...projeto,
    status: 'planejamento',
    feitas: 0,
    prazoEm: null,
    portalAtivo: false,
    portalAtivadoEm: null,
    briefingOrigem: 'kickoff',
    briefing: {
      ...projeto.briefing,
      criterioSucesso:
        '90% dos novos contatos recebem a primeira resposta em até um minuto durante o piloto.',
      acessos: ['WhatsApp Business · liberação por Camila', 'Agenda da recepção · leitura'],
      limites: ['Dúvidas clínicas seguem para a recepção'],
      proximosPassos: [
        'Camila libera os acessos até sexta-feira',
        'Mateus entrega o mapa inicial na terça-feira',
      ],
      observacoes:
        'O piloto começa em uma unidade e será revisado com a recepção depois de sete dias.',
      confirmadoEm: null,
    },
    kickoff: {
      id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
      status: 'concluida',
      agendadaPara: '2026-08-05T14:00:00.000Z',
      codigoPublico: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
    },
    arquivos: [],
    eventos: [],
    acoesPlano: [],
    tarefas: projeto.tarefas.map((tarefa) => ({
      ...tarefa,
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
    })),
  };
}

export function prepararProjetoEmExecucao(
  projeto: ProjetoExecucaoCompleto,
): ProjetoExecucaoCompleto {
  const feitas = 2;
  return {
    ...projeto,
    status: 'em_execucao',
    feitas,
    proximaTarefa: projeto.tarefas[feitas]?.titulo ?? null,
    acoesPlano: projeto.acoesPlano.map((acao, indice) =>
      indice === 0
        ? {
            ...acao,
            status: 'pendente',
            concluidaEm: null,
          }
        : acao,
    ),
    tarefas: projeto.tarefas.map((tarefa, indice) => ({
      ...tarefa,
      status: indice < feitas ? 'concluida' : indice === feitas ? 'em_andamento' : 'pendente',
      evidencia:
        indice < feitas
          ? tarefa.evidencia || 'Execução registrada e revisada.'
          : indice === feitas
            ? 'Base inicial preparada com as fontes aprovadas pelo cliente.'
            : null,
      clienteStatus: indice < feitas ? tarefa.clienteStatus : 'nao_solicitada',
      clienteNota: indice < feitas ? tarefa.clienteNota : null,
      entregavelUrl: indice < feitas ? tarefa.entregavelUrl : null,
      clienteComentario: null,
    })),
  };
}

export function prepararProjetoEmValidacao(
  projeto: ProjetoExecucaoCompleto,
): ProjetoExecucaoCompleto {
  const tarefaFinal = projeto.tarefas.at(-1);
  const convite = projeto.eventos.find(
    (evento) => evento.tarefaId === tarefaFinal?.id && evento.tipo === 'aprovacao_solicitada',
  );

  return {
    ...projeto,
    status: 'em_validacao',
    feitas: projeto.total,
    proximaTarefa: null,
    eventos: convite
      ? [
          {
            ...convite,
            id: '77777777-7777-4777-8777-777777777777',
            tipo: 'lembrete_aprovacao',
            criadoEm: '2026-08-12T17:10:00.000Z',
            emailDestinatario: 'camila@clinicaaurora.com.br',
            emailStatus: 'entregue',
            emailOrigemEventoId: convite.id,
          },
          ...projeto.eventos.map((evento) =>
            evento.id === convite.id
              ? {
                  ...evento,
                  emailDestinatario: 'camila@clinicaaurora.com.br',
                  emailStatus: 'entregue' as const,
                }
              : evento,
          ),
        ]
      : projeto.eventos,
    tarefas: projeto.tarefas.map((tarefa, indice, lista) => ({
      ...tarefa,
      status: 'concluida',
      evidencia: tarefa.evidencia || 'Execução registrada e revisada.',
      clienteStatus: indice === lista.length - 1 ? 'aguardando' : tarefa.clienteStatus,
      clienteNota:
        indice === lista.length - 1
          ? 'A operação foi entregue, testada e documentada para a equipe.'
          : tarefa.clienteNota,
    })),
  };
}

export function prepararProjetoComAjustes(
  projeto: ProjetoExecucaoCompleto,
): ProjetoExecucaoCompleto {
  const alvo = 2;
  return {
    ...prepararProjetoEmExecucao(projeto),
    feitas: 2,
    proximaTarefa: projeto.tarefas[alvo]?.titulo ?? null,
    tarefas: projeto.tarefas.map((tarefa, indice) => ({
      ...tarefa,
      status: indice < alvo ? 'concluida' : indice === alvo ? 'em_andamento' : 'pendente',
      evidencia: indice <= alvo ? tarefa.evidencia || 'Execução registrada e revisada.' : null,
      clienteStatus: indice === alvo ? 'ajustes' : tarefa.clienteStatus,
      clienteComentario:
        indice === alvo
          ? 'Inclua também os horários de feriado e deixe a transferência para a recepção mais evidente.'
          : tarefa.clienteComentario,
    })),
  };
}

export function prepararProjetoAposAprovacao(
  projeto: ProjetoExecucaoCompleto,
): ProjetoExecucaoCompleto {
  const feitas = 2;
  return {
    ...projeto,
    status: 'em_execucao',
    feitas,
    proximaTarefa: projeto.tarefas[feitas]?.titulo ?? null,
    acoesPlano: [],
    tarefas: projeto.tarefas.map((tarefa, indice) => ({
      ...tarefa,
      status: indice < feitas ? 'concluida' : 'pendente',
      evidencia: indice < feitas ? tarefa.evidencia || 'Execução registrada e revisada.' : null,
      clienteStatus:
        indice === feitas - 1
          ? 'aprovada'
          : indice < feitas
            ? tarefa.clienteStatus
            : 'nao_solicitada',
      clienteNota: indice < feitas ? tarefa.clienteNota : null,
      entregavelUrl: indice < feitas ? tarefa.entregavelUrl : null,
      clienteSolicitadoEm: indice === feitas - 1 ? tarefa.clienteSolicitadoEm : null,
      clienteRespondidoEm:
        indice === feitas - 1 ? '2026-09-03T13:20:00.000Z' : tarefa.clienteRespondidoEm,
      clienteComentario: null,
    })),
  };
}

export function prepararProjetoComResultado(
  projeto: ProjetoExecucaoCompleto,
): ProjetoExecucaoCompleto {
  return {
    ...projeto,
    evolucao: projeto.evolucao
      ? {
          ...projeto.evolucao,
          status: 'registrada',
          resultadoObservado:
            'A equipe passou a responder novos contatos em menos de um minuto durante o piloto.',
          evidenciaResultadoUrl: 'https://example.com/resultado',
          decisao: 'expandir',
          proximoPasso: 'Definir o segundo canal com a diretora de operações.',
          proximoPassoEm: '2026-09-15',
          compartilharCliente: true,
          registradaEm: '2026-09-09T14:00:00.000Z',
          oportunidadeContinuidadeId: null,
        }
      : null,
  };
}
