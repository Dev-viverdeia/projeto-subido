import { z } from 'zod';

export const GeracaoSobralSchema = z.object({
  mensagem_id: z.uuid(),
  thread_id: z.uuid(),
  tentativa: z.uuid(),
  estado: z.enum(['gerando', 'concluida', 'interrompida', 'falhou']),
  texto: z.string().max(3000),
  erro: z.string().nullable(),
  resposta_id: z.uuid().nullable(),
  parar_em: z.string().nullable(),
  expira_em: z.string(),
});
export type GeracaoSobral = z.infer<typeof GeracaoSobralSchema>;
export const EventoSobralSchema = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('estado'), geracao: GeracaoSobralSchema }),
  z.object({ tipo: z.literal('texto'), texto: z.string().max(3000) }),
  z.object({ tipo: z.literal('etapa'), etapa: z.enum(['lendo', 'pensando', 'finalizando']) }),
  z.object({ tipo: z.literal('erro'), mensagem: z.string().max(500) }),
]);
export type EventoSobral = z.infer<typeof EventoSobralSchema>;
