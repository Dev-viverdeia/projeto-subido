import type { StatusClienteProjeto, StatusProjetoExecucao, StatusTarefaProjeto } from './status';

export type DestinoJornadaEntrega =
  'briefing' | 'tarefa' | 'validacao' | 'compromisso' | 'arquivos';

export type MomentoJornadaEntrega = 'alinhar' | 'executar' | 'validar' | 'entregar';

type TarefaDaJornada = {
  id: string;
  titulo: string;
  status: StatusTarefaProjeto;
  clienteStatus: StatusClienteProjeto;
};

export type EstadoJornadaEntrega = {
  momento: MomentoJornadaEntrega;
  tom: 'normal' | 'aguardando' | 'ajuste' | 'concluido';
  titulo: string;
  descricao: string;
  rotuloAcao: string;
  nomeAcessivelAcao: string;
  destino: DestinoJornadaEntrega;
  tarefaId: string | null;
};

export function obterEstadoJornadaEntrega({
  status,
  briefingConfirmado,
  tarefas,
  compromisso,
}: {
  status: StatusProjetoExecucao;
  briefingConfirmado: boolean;
  tarefas: TarefaDaJornada[];
  compromisso: string | null;
}): EstadoJornadaEntrega {
  const ultimaTarefa = tarefas.at(-1) ?? null;

  if (status === 'concluido') {
    return {
      momento: 'entregar',
      tom: 'concluido',
      titulo: 'Entrega aprovada e encerrada.',
      descricao: 'A entrega final foi aprovada e o histórico ficou guardado nesta sala.',
      rotuloAcao: 'Revisar encerramento',
      nomeAcessivelAcao: 'Projeto concluído Entrega aceita pelo cliente',
      destino: 'validacao',
      tarefaId: ultimaTarefa?.id ?? null,
    };
  }

  if (!briefingConfirmado) {
    return {
      momento: 'alinhar',
      tom: 'normal',
      titulo: 'Confirme o combinado antes de começar.',
      descricao: 'Revise objetivo, responsáveis, acessos e limites com o cliente.',
      rotuloAcao: 'Revisar briefing',
      nomeAcessivelAcao: 'Revisar briefing do projeto',
      destino: 'briefing',
      tarefaId: null,
    };
  }

  const ajuste = tarefas.find((tarefa) => tarefa.clienteStatus === 'ajustes') ?? null;
  if (ajuste) {
    return {
      momento: 'executar',
      tom: 'ajuste',
      titulo: 'O cliente pediu um ajuste.',
      descricao: 'Abra o retorno, faça a correção e registre a nova versão antes de reenviar.',
      rotuloAcao: 'Abrir ajuste',
      nomeAcessivelAcao: `Abrir ajuste solicitado em ${ajuste.titulo}`,
      destino: 'tarefa',
      tarefaId: ajuste.id,
    };
  }

  const aguardando = tarefas.find((tarefa) => tarefa.clienteStatus === 'aguardando') ?? null;
  if (aguardando) {
    return {
      momento: 'validar',
      tom: 'aguardando',
      titulo: 'A entrega está com o cliente.',
      descricao:
        'Você pode seguir trabalhando. A sala será atualizada quando ele aprovar ou pedir ajustes.',
      rotuloAcao: 'Ver o que foi enviado',
      nomeAcessivelAcao: `Ver entrega enviada para validação: ${aguardando.titulo}`,
      destino: 'validacao',
      tarefaId: aguardando.id,
    };
  }

  if (compromisso) {
    return {
      momento: 'executar',
      tom: 'normal',
      titulo: compromisso,
      descricao:
        'Este compromisso foi combinado com o cliente e precisa entrar na sua sequência de trabalho.',
      rotuloAcao: 'Abrir compromisso',
      nomeAcessivelAcao: `Abrir compromisso ${compromisso}`,
      destino: 'compromisso',
      tarefaId: null,
    };
  }

  const proximaTarefa = tarefas.find((tarefa) => tarefa.status !== 'concluida') ?? null;
  if (proximaTarefa) {
    return {
      momento: 'executar',
      tom: 'normal',
      titulo: proximaTarefa.titulo,
      descricao: 'Execute o passo, registre a evidência e só então marque a tarefa como concluída.',
      rotuloAcao: 'Abrir próxima tarefa',
      nomeAcessivelAcao: `Próxima tarefa ${proximaTarefa.titulo}`,
      destino: 'tarefa',
      tarefaId: proximaTarefa.id,
    };
  }

  return {
    momento: 'validar',
    tom: 'normal',
    titulo: 'Tudo pronto para o aceite final.',
    descricao:
      'Envie a última entrega pelo portal. O projeto só será encerrado depois da aprovação do cliente.',
    rotuloAcao: 'Formalizar a entrega final',
    nomeAcessivelAcao: 'Formalizar a entrega final',
    destino: 'validacao',
    tarefaId: ultimaTarefa?.id ?? null,
  };
}
