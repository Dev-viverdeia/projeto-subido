import type { ExemploProjeto as ExemploNina } from './exemplo-projeto';

export const NINA_SLUG = 'sdr-atendimento-qualificacao';

export const exemplosPassosNina = {
  'mapear-jornada': {
    tipo: 'fluxo',
    titulo: 'Da primeira mensagem à reunião',
    etapas: [
      { titulo: 'Receber', detalhe: 'Identificar o pedido' },
      { titulo: 'Entender', detalhe: 'Perguntar o que falta' },
      { titulo: 'Agendar', detalhe: 'Confirmar um horário real' },
      { titulo: 'Passar', detalhe: 'Enviar contexto à equipe' },
    ],
    desvio: {
      quando: 'A pessoa pede atendimento humano',
      acao: 'Interromper a IA e encaminhar à equipe.',
    },
    entrega: 'Um mapa com caminho principal, desvios e responsáveis.',
  },
  'definir-qualificacao-limites': {
    tipo: 'ficha',
    titulo: 'Uma resposta. Uma evidência.',
    campos: [
      { rotulo: 'Pergunta', valor: 'Por onde chegam os pedidos hoje?' },
      { rotulo: 'Resposta do cliente', valor: '“Pelo WhatsApp. A equipe responde à mão.”' },
      { rotulo: 'Fato confirmado', valor: 'Atendimento manual pelo WhatsApp' },
      {
        rotulo: 'Ainda não sabemos',
        valor: 'Volume, prazo e responsável pela decisão',
        pendente: true,
      },
    ],
    entrega: 'Uma matriz que separa fatos, lacunas e critérios de passagem.',
  },
  'configurar-canal-base': {
    tipo: 'ficha',
    titulo: 'A resposta precisa ter uma fonte',
    campos: [
      { rotulo: 'Pergunta frequente', valor: 'Qual é o horário de atendimento?' },
      { rotulo: 'Resposta aprovada · exemplo', valor: 'Segunda a sexta, das 9h às 18h.' },
      { rotulo: 'Fonte e responsável', valor: 'Manual de atendimento · equipe de operação' },
      {
        rotulo: 'Antes de usar no cliente',
        valor: 'Confirmar horário, aprovação e data da revisão',
        pendente: true,
      },
    ],
    entrega: 'Canal de teste e base revisada, com fonte e responsável.',
  },
  'preparar-crm-agenda': {
    tipo: 'fluxo',
    titulo: 'Um contato, um histórico',
    etapas: [
      { titulo: 'Identificar', detalhe: 'Buscar o contato existente' },
      { titulo: 'Atualizar', detalhe: 'Registrar fatos e estado' },
      { titulo: 'Consultar', detalhe: 'Ver agenda e fuso' },
      { titulo: 'Confirmar', detalhe: 'Salvar uma única reunião' },
    ],
    desvio: {
      quando: 'O horário deixou de estar disponível',
      acao: 'Oferecer outra opção. Não confirmar a reserva.',
    },
    entrega: 'Contato único, agenda testada e uma pessoa responsável.',
  },
  'registrar-responder': {
    tipo: 'conversa',
    titulo: 'Responder só com o que está aprovado',
    cenarios: [
      {
        nome: 'Com fonte',
        entrada: 'Qual é o horário de atendimento?',
        resposta: 'Atendemos de segunda a sexta, das 9h às 18h.',
        decisao: 'Usar esta resposta apenas se o horário estiver na base aprovada do cliente.',
      },
      {
        nome: 'Sem fonte',
        entrada: 'Vocês fazem desconto de 20%?',
        resposta: 'Vou encaminhar seu pedido à equipe para confirmar as condições.',
        decisao: 'Registrar o pedido e encaminhar. Não inventar preço ou desconto.',
      },
      {
        nome: 'Evento repetido',
        entrada: 'O provedor enviou a mesma mensagem duas vezes.',
        resposta: 'Nenhuma nova resposta deve ser enviada.',
        decisao: 'Reconhecer o ID já processado e evitar uma segunda resposta.',
      },
    ],
    entrega: 'Entrada sem duplicação e respostas rastreáveis à base.',
  },
  'qualificar-agendar': {
    tipo: 'conversa',
    titulo: 'Uma pergunta por vez',
    cenarios: [
      {
        nome: 'Entender',
        entrada: 'Quero automatizar meu atendimento.',
        resposta: 'Por onde chegam os pedidos hoje?',
        decisao: 'Descobrir o canal antes de sugerir uma solução.',
      },
      {
        nome: 'Agendar',
        entrada: 'Pode ser amanhã às 10h?',
        resposta: 'Vou conferir esse horário na agenda.',
        decisao: 'Consultar disponibilidade, fuso e participantes antes de confirmar.',
      },
      {
        nome: 'Encaminhar',
        entrada: 'Prefiro falar com alguém da equipe.',
        resposta: 'Vou encaminhar você com o contexto desta conversa.',
        decisao: 'Pausar a IA e enviar fatos, dúvidas e compromissos à pessoa responsável.',
      },
    ],
    entrega: 'Uma passagem com contexto, sem fazer o cliente repetir tudo.',
  },
  'testar-cenarios': {
    tipo: 'conversa',
    titulo: 'Teste também quando algo dá errado',
    cenarios: [
      {
        nome: 'Falta informação',
        entrada: 'Quanto custa o serviço?',
        resposta: 'Vou encaminhar seu pedido para a equipe confirmar o valor.',
        decisao: 'Sem preço aprovado, não inventar. Registrar e encaminhar.',
      },
      {
        nome: 'Agenda indisponível',
        entrada: 'A consulta à agenda falhou.',
        resposta:
          'Não consegui confirmar o horário agora. Vou pedir à equipe para continuar o agendamento.',
        decisao: 'Não criar uma confirmação falsa. Registrar a falha e encaminhar.',
      },
      {
        nome: 'Pedido de pessoa',
        entrada: 'Quero falar com uma pessoa.',
        resposta: 'Vou chamar a equipe e encaminhar nossa conversa.',
        decisao: 'Interromper a automação. Verificar se a equipe recebeu o contexto.',
      },
    ],
    entrega:
      'Vinte testes registrados, com evidências e falhas retestadas. Aqui são três exemplos.',
  },
  'validar-com-equipe': {
    tipo: 'ficha',
    titulo: 'Compare antes de aprovar',
    campos: [
      { rotulo: 'Caso de teste', valor: 'Cliente pede orçamento, mas não informou o canal.' },
      { rotulo: 'Decisão da equipe', valor: 'Perguntar o canal antes de qualificar.' },
      {
        rotulo: 'Falha ilustrativa da IA',
        valor: 'Classificou como pronto para reunião.',
        pendente: true,
      },
      { rotulo: 'Correção a testar', valor: 'Exigir a informação do canal antes de avançar.' },
    ],
    entrega: 'Critérios calibrados e equipe capaz de assumir a conversa.',
  },
  'piloto-controlado': {
    tipo: 'fluxo',
    titulo: 'Comece pequeno. Observe. Decida.',
    etapas: [
      { titulo: 'Limitar', detalhe: 'Um canal e um horário' },
      { titulo: 'Acompanhar', detalhe: 'Revisar as primeiras conversas' },
      { titulo: 'Corrigir', detalhe: 'Retestar cada falha' },
      { titulo: 'Decidir', detalhe: 'Repetir ou ampliar o piloto' },
    ],
    desvio: {
      quando: 'Preço inventado, erro de agenda ou passagem sem responsável',
      acao: 'Pausar a IA e ativar o atendimento humano.',
    },
    entrega: 'Piloto acompanhado, com regras de pausa e decisão registrada.',
  },
  'manual-indicadores': {
    tipo: 'ficha',
    titulo: 'O cliente precisa saber operar',
    campos: [
      { rotulo: 'Rotina', valor: 'Revisar falhas, dúvidas sem resposta e passagens.' },
      { rotulo: 'Indicadores', valor: 'Volume, tempo de resposta e reuniões confirmadas.' },
      { rotulo: 'Se houver falha', valor: 'Pausar o agente e assumir o atendimento.' },
      {
        rotulo: 'Combinar com o cliente',
        valor: 'Responsável pela operação e data da primeira revisão',
        pendente: true,
      },
    ],
    entrega: 'Manual, responsáveis e uma primeira revisão agendada.',
  },
} satisfies Record<string, ExemploNina>;

/** O título faz parte da correspondência: aulas novas ou reordenadas não recebem um exemplo incorreto. */
const exemplosAulasNina: Record<string, ExemploNina> = {
  'Desenhe a conversa antes de configurar o agente': exemplosPassosNina['qualificar-agendar'],
  'Qualifique por fatos, não por intuição': exemplosPassosNina['definir-qualificacao-limites'],
  'Valide a operação antes de abrir o canal': {
    ...exemplosPassosNina['testar-cenarios'],
    entrega:
      'Três conversas controladas: caso comum, informação ausente e pedido de atendimento humano.',
  },
};

export function exemploPassoNina(slug: string, passoId: string): ExemploNina | null {
  if (slug !== NINA_SLUG || !Object.hasOwn(exemplosPassosNina, passoId)) return null;
  return exemplosPassosNina[passoId as keyof typeof exemplosPassosNina];
}

export function exemploAulaNina(slug: string, titulo: string): ExemploNina | null {
  return slug === NINA_SLUG && Object.hasOwn(exemplosAulasNina, titulo)
    ? exemplosAulasNina[titulo]!
    : null;
}
