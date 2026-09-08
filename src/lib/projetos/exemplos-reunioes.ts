import type { ExemploProjeto } from './exemplo-projeto';

export const REUNIOES_SLUG = 'inteligencia-comercial-com-ia';

/** Falas, pessoas e resultados simulados. Nenhuma gravação, tarefa ou envio é executado. */
export const exemplosPassosReunioes = {
  'mapear-reuniao': {
    tipo: 'fluxo',
    titulo: 'Da conversa ao próximo passo',
    etapas: [
      { titulo: 'Entender', detalhe: 'Cliente relata demora no atendimento' },
      { titulo: 'Aprofundar', detalhe: 'Vendedor pergunta volume e impacto' },
      { titulo: 'Combinar', detalhe: 'Definem ação, responsável e prazo' },
      { titulo: 'Registrar', detalhe: 'Revisam o que vai para o CRM' },
    ],
    desvio: {
      quando: 'O prazo não foi combinado',
      acao: 'Registrar a lacuna. Uma próxima ação sugerida não é um compromisso do cliente.',
    },
    entrega: 'Mapa de três calls autorizadas, com falas, decisões e registros que faltaram.',
  },
  'definir-leituras': {
    tipo: 'ficha',
    titulo: 'Cada informação no lugar certo',
    campos: [
      { rotulo: 'Fato declarado', valor: '“Respondemos no dia seguinte.” · Ana, 04:12' },
      { rotulo: 'Hipótese, não fato', valor: 'A demora pode reduzir as vendas.', pendente: true },
      {
        rotulo: 'Pergunta do coach',
        valor: '“O que acontece com esses contatos enquanto esperam?”',
      },
      {
        rotulo: 'Ação a confirmar',
        valor: 'Marcar uma demonstração. Data ainda não combinada.',
        pendente: true,
      },
    ],
    entrega: 'Regras de fonte, destino e revisão para cada saída da IA.',
  },
  'preparar-captura': {
    tipo: 'ficha',
    titulo: 'Uma fala precisa ter origem',
    campos: [
      { rotulo: 'Antes de gravar', valor: 'Participantes informados e consentimento registrado.' },
      { rotulo: 'Quem falou', valor: 'Ana · cliente · faixa de áudio identificada' },
      { rotulo: 'Onde conferir', valor: '04:12 a 04:18 · “Respondemos no dia seguinte.”' },
      {
        rotulo: 'Acesso e retenção',
        valor: 'Permissões, prazo de guarda e exclusão testados com o cliente.',
        pendente: true,
      },
    ],
    entrega: 'Captura testada com duas pessoas, sem trocar falas, horários ou permissões.',
  },
  'conectar-oportunidade': {
    tipo: 'fluxo',
    titulo: 'A call volta para a ficha certa',
    etapas: [
      { titulo: 'Selecionar', detalhe: 'Oportunidade de atendimento · ID A' },
      { titulo: 'Preparar', detalhe: 'Ana, Pedro e objetivo da call' },
      { titulo: 'Orientar', detalhe: 'Playbook aprovado · versão 2' },
      { titulo: 'Vincular', detalhe: 'Resumo e tarefas → ID A' },
    ],
    desvio: {
      quando: 'A mesma empresa tem outra oportunidade',
      acao: 'Usar o identificador da oportunidade. O nome da empresa não basta para vincular a reunião.',
    },
    entrega: 'Call de teste ligada ao CRM e à versão correta do playbook.',
  },
  'transcrever-coachear': {
    tipo: 'conversa',
    titulo: 'Uma dica, só quando ajuda',
    rotulos: { entrada: 'Trecho simulado da call', resposta: 'O que aparece para o vendedor' },
    cenarios: [
      {
        nome: 'Lacuna aberta',
        entrada: 'Ana, 04:12: “Os contatos esperam até o dia seguinte.”',
        resposta: 'Pergunte: “Quantos contatos ficam esperando em um dia comum?”',
        decisao:
          'Uma sugestão por vez. Neste exemplo, expira em 30 segundos ou quando o ponto for resolvido.',
      },
      {
        nome: 'Já respondido',
        entrada:
          'Ana, 04:35: “São cerca de vinte por dia.” Pedro segue perguntando sobre o impacto.',
        resposta: 'Nenhuma dica. O vendedor já avançou neste ponto.',
        decisao: 'Remover a sugestão anterior. Não repetir a pergunta nem competir com a conversa.',
      },
      {
        nome: 'Áudio incerto',
        entrada: '04:35: vozes sobrepostas; não é possível confirmar o volume nem quem falou.',
        resposta: 'Nenhuma dica baseada neste trecho. Sinalizar a falha de transcrição.',
        decisao:
          'Não adivinhar o número nem atribuir a fala ao cliente. Conferir o áudio antes de usar o dado.',
      },
    ],
    entrega: 'Sugestões testadas com gatilho, fonte, expiração e condição de silêncio.',
  },
  'gerar-pos-call': {
    tipo: 'pos-call',
    titulo: 'O que foi dito vira o quê?',
    cenarios: [
      {
        nome: 'Combinado',
        falas: [
          {
            pessoa: 'Ana · cliente',
            horario: '18:20',
            texto: 'Pode enviar a proposta de atendimento com IA até 12 de setembro?',
          },
          { pessoa: 'Pedro · vendedor', horario: '18:28', texto: 'Sim, eu envio até essa data.' },
        ],
        resumo: 'Ana pediu a proposta. Pedro confirmou o envio até 12 de setembro.',
        estado: 'acordo',
        tarefa: 'Enviar proposta de atendimento com IA',
        responsavel: 'Pedro',
        prazo: '12 de setembro',
        revisao:
          'Conferir os trechos e aprovar a tarefa. O acordo não significa que a proposta já foi enviada.',
      },
      {
        nome: 'Sem prazo',
        falas: [
          {
            pessoa: 'Ana · cliente',
            horario: '18:20',
            texto: 'Pode me enviar a proposta de atendimento com IA?',
          },
          { pessoa: 'Pedro · vendedor', horario: '18:28', texto: 'Sim, eu preparo e envio.' },
        ],
        resumo: 'O envio foi combinado, mas ninguém definiu uma data.',
        estado: 'pendente',
        tarefa: 'Enviar proposta de atendimento com IA',
        responsavel: 'Pedro',
        prazo: 'Não combinado',
        revisao:
          'Confirmar o prazo ou definir uma data interna, identificada como interna. Não atribuí-la ao cliente.',
      },
      {
        nome: 'Só uma sugestão',
        falas: [
          {
            pessoa: 'Pedro · vendedor',
            horario: '18:20',
            texto: 'Posso preparar uma proposta para vocês?',
          },
          {
            pessoa: 'Ana · cliente',
            horario: '18:28',
            texto: 'Ainda preciso conversar com a minha sócia.',
          },
        ],
        resumo: 'Ana ainda vai conversar com a sócia. Não houve aceite da proposta sugerida.',
        estado: 'sem_acordo',
        tarefa: 'Nenhuma tarefa combinada neste trecho',
        responsavel: 'Não definido',
        prazo: 'Não combinado',
        revisao:
          'Registrar a pendência. O vendedor pode definir uma ação interna, sem apresentá-la como compromisso da cliente.',
      },
    ],
    entrega: 'Resumo, tarefas e rascunhos revisáveis, sempre ligados à fala de origem.',
  },
  'comparar-calls': {
    tipo: 'ficha',
    titulo: 'Uma tarefa inventada não se dilui na média',
    campos: [
      {
        rotulo: 'Amostra simulada',
        valor: '10 calls · gabarito feito antes de ver a análise da IA',
      },
      { rotulo: 'Fatos extraídos', valor: '18 de 20 corretos → 90% de precisão' },
      {
        rotulo: 'Tarefas extraídas',
        valor: '4 de 5 corretas → 1 compromisso inventado',
        pendente: true,
      },
      {
        rotulo: 'Decisão',
        valor: 'Corrigir a causa e repetir os casos críticos antes de ampliar.',
        pendente: true,
      },
    ],
    entrega: 'Qualidade medida por tipo de saída, incluindo fatos omitidos e dicas fora de hora.',
  },
  'testar-ponta-a-ponta': {
    tipo: 'conversa',
    titulo: 'A revisão sobrevive às falhas?',
    rotulos: { entrada: 'Situação simulada', resposta: 'Resultado esperado' },
    cenarios: [
      {
        nome: 'Revisão interrompida',
        entrada: 'O vendedor corrigiu o resumo e saiu antes de aprovar a tarefa.',
        resposta: 'Ao voltar, a correção permanece e a tarefa continua pendente.',
        decisao:
          'Conferir na ficha o que foi salvo. Não concluir a revisão inteira por uma aprovação parcial.',
      },
      {
        nome: 'Confirmação repetida',
        entrada: 'Após uma falha de rede, a mesma confirmação foi reenviada.',
        resposta: 'Uma única tarefa no CRM, ligada à mesma call.',
        decisao:
          'Conferir o registro no destino. Uma resposta de sucesso não prova ausência de duplicatas.',
      },
      {
        nome: 'Sem permissão',
        entrada: 'Uma pessoa sem acesso tenta abrir a gravação de outra oportunidade.',
        resposta: 'Acesso bloqueado, sem exibir áudio, transcrição ou resumo.',
        decisao:
          'Testar permissões com cada papel. Não depender apenas de esconder o link na tela.',
      },
    ],
    entrega: 'Fluxo testado com reconexão, revisão parcial, repetição e diferentes permissões.',
  },
  'piloto-vendedores': {
    tipo: 'fluxo',
    titulo: 'Comece com um grupo pequeno',
    etapas: [
      { titulo: 'Preparar', detalhe: '2 ou 3 vendedores · um tipo de call' },
      { titulo: 'Acompanhar', detalhe: '10 reuniões com revisão humana' },
      { titulo: 'Comparar', detalhe: 'Qualidade e tempo de registro' },
      { titulo: 'Decidir', detalhe: 'Corrigir, repetir ou ampliar' },
    ],
    desvio: {
      quando: 'Uma fala ou tarefa foi atribuída à pessoa errada',
      acao: 'Pausar a saída afetada, preservar a reunião e corrigir antes de retestar.',
    },
    entrega:
      'Piloto acompanhado, com critério de pausa e resultado comparado ao processo anterior.',
  },
  'instituir-revisao': {
    tipo: 'ficha',
    titulo: 'O cliente sabe operar sem você?',
    campos: [
      { rotulo: 'Vendedor', valor: 'Revisa trechos, corrige o resumo e confirma tarefas.' },
      { rotulo: 'Líder', valor: 'Confere uma amostra semanal e registra divergências.' },
      {
        rotulo: 'Responsável técnico',
        valor: 'Testa mudanças, guarda versões e sabe voltar à anterior.',
      },
      {
        rotulo: 'Antes de entregar',
        valor: 'Agendar a primeira revisão e validar acesso, retenção e exclusão.',
        pendente: true,
      },
    ],
    entrega: 'Manual testado pela equipe, com responsáveis e revisão semanal agendada.',
  },
} satisfies Record<string, ExemploProjeto>;

const exemplosAulasReunioes: Record<string, ExemploProjeto> = {
  'Capture a reunião como evidência confiável': exemplosPassosReunioes['preparar-captura'],
  'Faça o Live Coach ajudar sem tomar a reunião': exemplosPassosReunioes['transcrever-coachear'],
  'Leve fatos confirmados ao CRM': exemplosPassosReunioes['gerar-pos-call'],
};

export function exemploPassoReunioes(slug: string, passoId: string): ExemploProjeto | null {
  if (slug !== REUNIOES_SLUG || !Object.hasOwn(exemplosPassosReunioes, passoId)) return null;
  return exemplosPassosReunioes[passoId as keyof typeof exemplosPassosReunioes];
}
export function exemploAulaReunioes(slug: string, titulo: string): ExemploProjeto | null {
  return slug === REUNIOES_SLUG && Object.hasOwn(exemplosAulasReunioes, titulo)
    ? exemplosAulasReunioes[titulo]!
    : null;
}
