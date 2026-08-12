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
