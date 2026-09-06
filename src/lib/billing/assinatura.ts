export const STATUS_ASSINATURA_GERENCIAVEL = [
  'active',
  'trialing',
  'past_due',
  'unpaid',
  'incomplete',
  'paused',
];

export type AssinaturaResumo = {
  status: string;
  cancela_ao_fim_do_periodo: boolean;
  periodo_atual_termina_em: string | null;
};

const DATA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Sao_Paulo',
});

export function apresentarAssinatura(assinatura: AssinaturaResumo | null) {
  const status = assinatura?.status;
  const data = assinatura?.periodo_atual_termina_em
    ? new Date(assinatura.periodo_atual_termina_em)
    : null;
  const fim = data && Number.isFinite(data.getTime()) ? DATA.format(data) : null;
  const gerenciavel = Boolean(status && STATUS_ASSINATURA_GERENCIAVEL.includes(status));
  const detalhes: Record<
    string,
    { titulo: string; descricao: string; acao: string; tom: 'neutro' | 'sucesso' | 'atencao' }
  > = {
    active: {
      titulo: 'Assinatura ativa',
      descricao: fim ? `Renovação em ${fim}.` : 'Consulte seu próximo ciclo no portal de cobrança.',
      acao: 'Gerenciar cobrança',
      tom: 'sucesso',
    },
    trialing: {
      titulo: 'Período de teste',
      descricao: fim ? `Teste até ${fim}.` : 'Confira as condições do teste no portal de cobrança.',
      acao: 'Gerenciar cobrança',
      tom: 'neutro',
    },
    past_due: {
      titulo: 'Pagamento pendente',
      descricao: 'Atualize o pagamento para regularizar a assinatura.',
      acao: 'Regularizar pagamento',
      tom: 'atencao',
    },
    unpaid: {
      titulo: 'Pagamento não concluído',
      descricao: 'Consulte a cobrança pendente antes de assinar novamente.',
      acao: 'Revisar cobrança',
      tom: 'atencao',
    },
    incomplete: {
      titulo: 'Assinatura não concluída',
      descricao: 'Verifique o pagamento para concluir a assinatura.',
      acao: 'Revisar cobrança',
      tom: 'atencao',
    },
    paused: {
      titulo: 'Assinatura pausada',
      descricao: 'Consulte sua assinatura no portal de cobrança.',
      acao: 'Gerenciar cobrança',
      tom: 'atencao',
    },
    canceled: {
      titulo: 'Assinatura encerrada',
      descricao: 'Não há renovação automática desta assinatura.',
      acao: '',
      tom: 'neutro',
    },
    incomplete_expired: {
      titulo: 'Assinatura não ativada',
      descricao: 'O prazo para concluir o pagamento expirou.',
      acao: '',
      tom: 'neutro',
    },
  };
  if ((status === 'active' || status === 'trialing') && assinatura?.cancela_ao_fim_do_periodo) {
    return {
      titulo: 'Cancelamento agendado',
      descricao: fim
        ? `Acesso até ${fim}. Sem renovação automática.`
        : 'Consulte a data de encerramento no portal de cobrança.',
      acao: 'Gerenciar cobrança',
      tom: 'neutro' as const,
      gerenciavel,
    };
  }
  return {
    ...((status ? detalhes[status] : null) ?? {
      titulo: assinatura ? 'Status em atualização' : 'Sem assinatura recorrente',
      descricao: 'Seu acesso atual aparece abaixo.',
      acao: '',
      tom: 'neutro' as const,
    }),
    gerenciavel,
  };
}
