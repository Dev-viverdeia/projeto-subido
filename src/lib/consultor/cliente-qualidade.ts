import type { ClienteSobral } from './cliente';
import { sinaisDeQualidade } from './qualidade-cenarios';

/** Somente dados fictícios para testes de personalização e fidelidade. */
export function sinaisClienteQualidade() {
  const sinais = sinaisDeQualidade();
  const fatos: ClienteSobral['fatos'] = [
    {
      fonte: 'Cadastro',
      natureza: 'registro',
      texto: 'Contato: Mariana, gerente. Clínica Aurora, atendimento ambulatorial.',
      data: '2026-09-09T12:00:00Z',
    },
    {
      fonte: 'Pesquisa',
      natureza: 'registro',
      texto: 'Site apresenta agenda de fisioterapia e atendimento pelo WhatsApp.',
      data: '2026-08-20T12:00:00Z',
    },
    {
      fonte: 'Pesquisa',
      natureza: 'hipotese',
      texto:
        'Pode haver perda de agendamentos por demora. Validar volume e tempo antes de concluir.',
      data: '2026-08-20T12:00:00Z',
    },
    {
      fonte: 'Histórico',
      natureza: 'registro',
      texto:
        'Mariana informou pelo WhatsApp: 120 pedidos por dia e 18 minutos de primeira resposta. Combinado: agendar fisioterapia, sem diagnóstico médico. Aprovação com a diretora Paula.',
      data: '2026-09-09T12:00:00Z',
    },
    {
      fonte: 'Proposta',
      natureza: 'registro',
      texto:
        'Rascunho de proposta: agenda de fisioterapia, FAQ aprovado e transferência para recepção. Investimento ainda não aprovado.',
      data: '2026-09-09T12:00:00Z',
    },
  ];
  sinais.cliente = {
    estado: 'consultado',
    opcoes: [],
    fatos,
    ficha: {
      oportunidadeId: sinais.foco!.oportunidadeId,
      empresa: 'Clínica Aurora',
      consultadaEm: sinais.momento,
      incompleta: false,
      fontes: [
        { nome: 'Cadastro', registros: 1, atualizadaEm: sinais.momento },
        { nome: 'Pesquisa', registros: 2, atualizadaEm: '2026-08-20T12:00:00Z' },
        { nome: 'Histórico', registros: 1, atualizadaEm: sinais.momento },
        { nome: 'Proposta', registros: 1, atualizadaEm: sinais.momento },
      ],
    },
  };
  return sinais;
}

export const CENARIOS_CLIENTE = [
  {
    id: 'mensagem-personalizada',
    pedido:
      'Use a ficha da Clínica Aurora e escreva só uma mensagem de WhatsApp para Mariana, de até 70 palavras, retomando o que combinamos. Não peça de novo os dados que ela informou.',
    contem: /fisioterapia|18 minutos|120/,
    nao: /qual (é )?(o )?seu (nome|cargo)|quantos pedidos/i,
  },
  {
    id: 'proposta-com-base',
    pedido:
      'Quero criar a proposta da Clínica Aurora a partir do combinado pelo WhatsApp. Qual escopo entra? Seja curto e não exija reunião.',
    contem: /fisioterapia|recepção/,
    destino: '/propostas/nova',
    nao: /escopo (já )?aprovado|investimento aprovado/i,
  },
  {
    id: 'hipotese-nao-e-fato',
    pedido:
      'A pesquisa prova que a Clínica Aurora perde agendamentos? Explique em até 60 palavras.',
    contem: /não|hipótese|confirmar/,
    nao: /comprova que|prova que.*perde/,
  },
  {
    id: 'atualizacao-do-usuario',
    pedido:
      'Atualizando a Clínica Aurora: Mariana mediu agora e o tempo de resposta caiu de 18 para 5 minutos. Qual tempo uso como referência na proposta?',
    contem: /5 minutos/,
    nao: /atualizei|salvei.*ficha/,
  },
  {
    id: 'ambiguo',
    pedido: 'Quero uma proposta para a Clínica Aurora.',
    contem: /Agenda|Relatórios/,
    ambiguo: true,
  },
  {
    id: 'consulta-incompleta',
    pedido: 'O que já tenho na ficha da Clínica Aurora para a proposta? Seja breve.',
    contem: /parte|parcial|não.*(ler|consultar)|incompleta|limita/,
    incompleta: true,
  },
] as const;
