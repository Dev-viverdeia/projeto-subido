import type { MentorExemplo, MentoriaExemplo, Trilha } from './types';

/**
 * MENTORES DE DEMONSTRAÇÃO.
 *
 * São RÓTULOS DE PAPEL, não pessoas. Nenhum nome, foto ou credencial de gente
 * inventada entra aqui: esta tela se apoia inteira em atribuição — horário,
 * vagas, trilha — e um mentor fictício derrubaria a credibilidade de tudo que
 * está ao lado dele. É a mesma regra dos depoimentos.
 *
 * TODO(backend): vira a tabela `mentores`. Quando os mentores reais forem
 * cadastrados, `nome` recebe o nome deles e `fotoUrl` o retrato do Storage —
 * a UI não muda de forma, só deixa de mostrar o monograma.
 */
export const MENTORES_EXEMPLO: MentorExemplo[] = [
  {
    id: 'mentor-implementacao',
    nome: 'Mentoria de Implementação',
    headline: 'Encontro semanal em grupo · Comunidade Subido',
    trilha: 'implementacao',
    iniciais: 'IMP',
    fotoUrl: null,
  },
  {
    id: 'mentor-trafego',
    nome: 'Mentoria de Tráfego',
    headline: 'Encontro semanal em grupo · Comunidade Subido',
    trilha: 'trafego',
    iniciais: 'TRF',
    fotoUrl: null,
  },
  {
    id: 'mentor-comercial',
    nome: 'Mentoria Comercial',
    headline: 'Encontro quinzenal em grupo · Comunidade Subido',
    trilha: 'comercial',
    iniciais: 'COM',
    fotoUrl: null,
  },
  {
    id: 'mentor-produto',
    nome: 'Mentoria de Produto',
    headline: 'Encontro mensal em grupo · Comunidade Subido',
    trilha: 'produto',
    iniciais: 'PRD',
    fotoUrl: null,
  },
];

export function mentorPorId(id: string): MentorExemplo | undefined {
  return MENTORES_EXEMPLO.find((m) => m.id === id);
}

/** Check-in abre 48h antes do início — fora disso, o item mostra a data de abertura. */
export const JANELA_CHECKIN_HORAS = 48;

/**
 * Temas por trilha. A sessão recorrente cicla por eles em vez de repetir o mesmo
 * título quatro vezes — um calendário com "Mentoria de Tráfego" em toda célula
 * não mostra nada sobre o produto.
 */
const TEMAS: Record<Trilha, string[]> = {
  implementacao: [
    'Do briefing ao fluxo entregue',
    'Quando o automatizado precisa devolver para humano',
    'Escopo fechado: o que entra e o que vira cobrança extra',
    'Revisão de projeto ao vivo',
  ],
  trafego: [
    'Criativo que sobrevive à segunda semana',
    'Leitura de campanha: o que olhar antes de mexer',
    'Público que esgota — e o que fazer antes disso',
    'Relatório de uma página que sustenta a mensalidade',
  ],
  comercial: [
    'Diagnóstico que vira proposta assinada',
    'Precificação: hora, pacote ou performance',
  ],
  produto: ['Roadmap do implementador: os próximos 90 dias'],
};

/**
 * AGENDA DE DEMONSTRAÇÃO — datas RELATIVAS ao agora recebido, para que cada
 * estado da matriz (ao vivo, hoje, amanhã, semana, lotada, fora da janela)
 * esteja sempre visível em desenvolvimento, em qualquer dia que a tela abra.
 *
 * A página anuncia que é demonstração num Alert visível. TODO(backend): apagar
 * este módulo quando a tabela de mentorias existir.
 *
 * É uma FUNÇÃO que recebe `agora` (e não lê o relógio): o servidor passa o
 * instante da renderização, e o cliente hidrata com o MESMO valor — rótulos
 * como "começa em 45 min" ficam idênticos dos dois lados. Também é o que
 * mantém a função determinística, sem `Date.now()` nem `Math.random()`.
 */
export function gerarAgendaExemplo(agora: Date): MentoriaExemplo[] {
  const em = (horas: number, duracaoMin = 90) => {
    const inicio = new Date(agora.getTime() + horas * 3_600_000);
    const fim = new Date(inicio.getTime() + duracaoMin * 60_000);
    return { inicioIso: inicio.toISOString(), fimIso: fim.toISOString() };
  };

  /* As seis sessões da MATRIZ — escritas à mão porque cada uma existe para
     provar um estado, e estado que depende de sorteio não se testa. */
  const matriz: MentoriaExemplo[] = [
    {
      id: 'demo-ao-vivo',
      titulo: 'Destravando o primeiro cliente de implementação',
      descricao:
        'Sessão aberta de dúvidas sobre proposta, escopo e precificação do primeiro projeto. Traga o caso real — a mentoria funciona em cima do que você está vendendo agora.',
      mentorId: 'mentor-implementacao',
      ...em(-0.4, 90),
      vagas: 30,
      inscritos: 22,
    },
    {
      id: 'demo-hoje',
      titulo: 'Automação de atendimento: erros que derrubam o fluxo',
      descricao:
        'Os cinco erros mais comuns nos fluxos de WhatsApp dos alunos, com correção ao vivo em cima de casos enviados no check-in.',
      mentorId: 'mentor-implementacao',
      ...em(3, 60),
      vagas: 30,
      inscritos: 14,
    },
    {
      id: 'demo-amanha',
      titulo: 'Relatórios que o cliente entende (e paga para manter)',
      descricao:
        'Como transformar métricas de campanha em relatório de uma página que sustenta a mensalidade. Modelo aberto na tela, do zero.',
      mentorId: 'mentor-trafego',
      ...em(27, 90),
      vagas: 30,
      inscritos: 9,
    },
    {
      id: 'demo-semana-lotada',
      titulo: 'Hot seat: um funil de aluno dissecado ao vivo',
      descricao:
        'Um funil real de aluno analisado do anúncio ao fechamento. As vagas são menores porque todo mundo opina — é oficina, não palestra.',
      mentorId: 'mentor-trafego',
      ...em(52, 120),
      vagas: 12,
      inscritos: 12,
    },
    {
      id: 'demo-fora-janela',
      titulo: 'Precificação de projeto: hora, pacote ou performance',
      descricao:
        'Os três modelos de cobrança de implementação comparados com números reais de alunos — e quando cada um quebra.',
      mentorId: 'mentor-comercial',
      ...em(30 * 24, 90),
      vagas: 30,
      inscritos: 0,
    },
    {
      id: 'demo-encerrada',
      titulo: 'Como escolher a ferramenta sem virar refém dela',
      descricao:
        'Critério de escolha entre as plataformas de automação, com a conta de migração que quase ninguém faz antes de assinar.',
      mentorId: 'mentor-produto',
      ...em(-30 * 24, 90),
      vagas: 30,
      inscritos: 27,
    },
  ];

  /* A RECORRÊNCIA, que é o que dá conteúdo ao calendário. Sem ela o mês fica com
     seis células preenchidas e trinta vazias — e uma grade quase vazia não prova
     nada sobre a tela. Cadência por trilha, ancorada no agora e determinística. */
  const recorrentes: MentoriaExemplo[] = [];
  const cadencia: Array<{ trilha: Trilha; mentorId: string; passoDias: number; hora: number }> = [
    { trilha: 'implementacao', mentorId: 'mentor-implementacao', passoDias: 7, hora: 19 },
    { trilha: 'trafego', mentorId: 'mentor-trafego', passoDias: 7, hora: 20 },
    { trilha: 'comercial', mentorId: 'mentor-comercial', passoDias: 14, hora: 19 },
    { trilha: 'produto', mentorId: 'mentor-produto', passoDias: 30, hora: 18 },
  ];

  for (const { trilha, mentorId, passoDias, hora } of cadencia) {
    const temas = TEMAS[trilha];
    /* Janela em DIAS, não em passos: com passos, a trilha mensal cobria dez meses
       enquanto a semanal cobria dois, e o calendário ficava ralo nas pontas. Aqui
       toda trilha cobre a mesma faixa — ~6 semanas atrás, ~10 à frente. */
    const antes = Math.ceil(42 / passoDias);
    const depois = Math.ceil(70 / passoDias);
    for (let n = -antes; n <= depois; n += 1) {
      const dia = new Date(agora);
      dia.setDate(dia.getDate() + n * passoDias);
      dia.setHours(hora, 0, 0, 0);
      // Não colide com as sessões da matriz, que mandam nas primeiras 72h.
      const delta = dia.getTime() - agora.getTime();
      if (delta > -3_600_000 && delta < 72 * 3_600_000) continue;

      const i = ((n % temas.length) + temas.length) % temas.length;
      const tema = temas[i];
      if (!tema) continue;
      const fim = new Date(dia.getTime() + 90 * 60_000);
      recorrentes.push({
        id: `rec-${trilha}-${n}`,
        titulo: tema,
        descricao:
          'Encontro recorrente da trilha. A pauta sai dos casos enviados no check-in — quem chega com problema real sai com o próximo passo definido.',
        mentorId,
        inicioIso: dia.toISOString(),
        fimIso: fim.toISOString(),
        vagas: 30,
        // Lotação varia de forma determinística, para a barra de vagas não ser sempre igual.
        inscritos: Math.min(30, 6 + ((((n * 7 + hora) % 24) + 24) % 24)),
      });
    }
  }

  return [...matriz, ...recorrentes].sort((a, b) => a.inicioIso.localeCompare(b.inicioIso));
}
