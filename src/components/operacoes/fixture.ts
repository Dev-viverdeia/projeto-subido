import type { ResumoAtendimento } from '@/lib/operacoes/atendimento';

/** Dados sintéticos usados somente por testes e pela preview bloqueada em produção. */
export function atendimentoExemplo(): ResumoAtendimento {
  return {
    verificado_em: '2026-09-09T17:00:00Z',
    ia: { ativas: 2, expiradas: 0, concluidas: 42, falhas: 0, interrompidas: 0 },
    entrada: { aguardando: 1, atrasadas: 0, revisao: 0, falhas: 0, concluidas: 12 },
    saida: {
      aguardando: 2,
      atrasadas: 0,
      falhas: 0,
      sem_confirmacao: 0,
      devolvidas: 0,
      aceitas: 1,
      entregues: 18,
    },
    pulsos: ['recebimento', 'envio', 'limpeza'].map((fase) => ({
      fase: fase as 'recebimento' | 'envio' | 'limpeza',
      conferido_em: '2026-09-09T16:59:30Z',
      falhou: false,
      falhas_seguidas: 0,
    })),
  };
}
