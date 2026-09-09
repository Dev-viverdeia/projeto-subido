'use client';
import { useActionState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { agendarReuniao, type EstadoAgendamento } from '@/lib/calls/actions';
import { CAMPOS_RASCUNHO, type RascunhoAgenda } from '@/lib/calls/rascunho-agenda';

export function useAgendamento(rascunho?: RascunhoAgenda) {
  return useActionState(
    async (anterior: EstadoAgendamento, form: FormData): Promise<EstadoAgendamento> => {
      try {
        return await agendarReuniao(anterior, form);
      } catch (erro) {
        unstable_rethrow(erro);
        const campos = Object.fromEntries(
          CAMPOS_RASCUNHO.map((campo) => {
            const valor = form.get(campo);
            return [campo, typeof valor === 'string' ? valor : ''];
          }),
        );
        return {
          campos,
          conferir: true,
          erro: 'Não foi possível confirmar o agendamento. Confira suas reuniões antes de tentar novamente.',
        };
      }
    },
    rascunho ? { campos: rascunho } : {},
  );
}
