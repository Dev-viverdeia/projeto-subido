/** Explicação editorial do fluxo, não uma simulação de execução ou de resultados. */
export type MovimentoProjeto = {
  titulo: string;
  exemplo: string;
  descricao: string;
};

export type VisaoVisualProjeto = {
  entrada: MovimentoProjeto;
  processamento: MovimentoProjeto;
  entrega: MovimentoProjeto;
};

const VISOES: Record<string, VisaoVisualProjeto> = {
  'sdr-atendimento-qualificacao': {
    entrada: {
      titulo: 'Mensagem no WhatsApp',
      exemplo: '“Quero saber mais sobre o serviço.”',
      descricao: 'O cliente inicia a conversa pelo canal oficial da empresa.',
    },
    processamento: {
      titulo: 'IA atende e qualifica',
      exemplo: 'Responde → pergunta → confirma o perfil',
      descricao:
        'Usa as informações aprovadas, faz uma pergunta por vez e chama uma pessoa quando necessário.',
    },
    entrega: {
      titulo: 'Reunião e passagem',
      exemplo: 'Agenda + resumo para o vendedor',
      descricao:
        'Confirma o horário disponível e entrega o histórico à equipe, sem negociar ou fechar a venda sozinha.',
    },
  },
  'maquina-prospeccao-b2b': {
    entrada: {
      titulo: 'Perfil do cliente',
      exemplo: 'Segmento + região + critérios',
      descricao:
        'Você define quais empresas procurar e quais informações precisam ser verificadas.',
    },
    processamento: {
      titulo: 'Pesquisa com IA',
      exemplo: 'Encontra → verifica → organiza',
      descricao:
        'Consulta fontes públicas, identifica contatos profissionais e separa fatos de informações ainda não confirmadas.',
    },
    entrega: {
      titulo: 'Lista para abordar',
      exemplo: 'Empresas + contatos + fontes',
      descricao:
        'A equipe revisa a lista priorizada e escolhe quem abordar. A pesquisa não envia mensagens automaticamente.',
    },
  },
  'inteligencia-comercial-com-ia': {
    entrada: {
      titulo: 'Reunião gravada',
      exemplo: 'Conversa com autorização',
      descricao: 'A gravação autorizada preserva o que foi discutido com o cliente.',
    },
    processamento: {
      titulo: 'IA organiza a conversa',
      exemplo: 'Transcrição → decisões → tarefas',
      descricao:
        'Identifica problemas, compromissos e próximos passos, sempre ligados ao que foi dito na reunião.',
    },
    entrega: {
      titulo: 'Venda organizada',
      exemplo: 'Resumo + tarefas + mensagem de retorno',
      descricao:
        'O vendedor revisa os registros e a mensagem antes de atualizar a venda e falar com o cliente.',
    },
  },
  'operacao-conteudo-multicanal': {
    entrada: {
      titulo: 'Ideias da empresa',
      exemplo: 'Conhecimento + público + canais',
      descricao: 'Reúne fontes próprias, tom de voz e assuntos que a empresa quer abordar.',
    },
    processamento: {
      titulo: 'IA prepara o conteúdo',
      exemplo: 'Pauta → rascunho → adaptação',
      descricao: 'Prepara versões para cada canal usando as fontes e as orientações da marca.',
    },
    entrega: {
      titulo: 'Conteúdo para aprovar',
      exemplo: 'Peças + revisão + calendário',
      descricao:
        'Uma pessoa revisa e aprova as peças antes da publicação e acompanha os resultados.',
    },
  },
  'radar-satisfacao-com-ia': {
    entrada: {
      titulo: 'Resposta do cliente',
      exemplo: 'Nota + comentário',
      descricao:
        'Uma pesquisa coleta a experiência do cliente e a autorização para um possível retorno.',
    },
    processamento: {
      titulo: 'IA analisa os comentários',
      exemplo: 'Agrupa temas → identifica atenção',
      descricao:
        'Organiza elogios e problemas recorrentes sem generalizar o que poucas respostas dizem.',
    },
    entrega: {
      titulo: 'Equipe pode agir',
      exemplo: 'Resumo + alerta + retorno',
      descricao:
        'O responsável recebe os alertas e revisa a resposta ao cliente antes de entrar em contato.',
    },
  },
};

export function obterVisaoVisual(slug: string): VisaoVisualProjeto | null {
  return Object.hasOwn(VISOES, slug) ? VISOES[slug]! : null;
}
