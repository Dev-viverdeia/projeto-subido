import type { MentoriaExemplo } from './types';

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
 * como "começa em 45 min" ficam idênticos dos dois lados.
 */
export function gerarAgendaExemplo(agora: Date): MentoriaExemplo[] {
  const em = (horas: number, duracaoMin = 90) => {
    const inicio = new Date(agora.getTime() + horas * 3_600_000);
    const fim = new Date(inicio.getTime() + duracaoMin * 60_000);
    return { inicioIso: inicio.toISOString(), fimIso: fim.toISOString() };
  };

  return [
    {
      id: 'demo-ao-vivo',
      titulo: 'Destravando o primeiro cliente de implementação',
      descricao:
        'Sessão aberta de dúvidas sobre proposta, escopo e precificação do primeiro projeto. Traga o caso real — a mentoria funciona em cima do que você está vendendo agora.',
      mentor: { nome: 'Equipe Subido', headline: 'Mentoria em grupo semanal' },
      ...em(-0.4, 90),
      vagas: 30,
      inscritos: 22,
    },
    {
      id: 'demo-hoje',
      titulo: 'Automação de atendimento: erros que derrubam o fluxo',
      descricao:
        'Os cinco erros mais comuns nos fluxos de WhatsApp dos alunos, com correção ao vivo em cima de casos enviados no check-in.',
      mentor: { nome: 'Equipe Subido', headline: 'Mentoria em grupo semanal' },
      ...em(3, 60),
      vagas: 30,
      inscritos: 14,
    },
    {
      id: 'demo-amanha',
      titulo: 'Relatórios que o cliente entende (e paga para manter)',
      descricao:
        'Como transformar métricas de campanha em relatório de uma página que sustenta a mensalidade. Modelo aberto na tela, do zero.',
      mentor: { nome: 'Equipe Subido', headline: 'Mentoria em grupo semanal' },
      ...em(27, 90),
      vagas: 30,
      inscritos: 9,
    },
    {
      id: 'demo-semana-lotada',
      titulo: 'Hot seat: um funil de aluno dissecado ao vivo',
      descricao:
        'Um funil real de aluno analisado do anúncio ao fechamento. As vagas são menores porque todo mundo opina — é oficina, não palestra.',
      mentor: { nome: 'Equipe Subido', headline: 'Mentoria em grupo semanal' },
      ...em(52, 120),
      vagas: 12,
      inscritos: 12,
    },
    {
      id: 'demo-fora-janela',
      titulo: 'Precificação de projeto: hora, pacote ou performance',
      descricao:
        'Os três modelos de cobrança de implementação comparados com números reais de alunos — e quando cada um quebra.',
      mentor: { nome: 'Equipe Subido', headline: 'Mentoria em grupo semanal' },
      ...em(30 * 24, 90),
      vagas: 30,
      inscritos: 0,
    },
  ];
}

/** Check-in abre 48h antes do início — fora disso, o item mostra a data de abertura. */
export const JANELA_CHECKIN_HORAS = 48;
