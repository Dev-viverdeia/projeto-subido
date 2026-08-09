'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { registrarDecisaoCliente } from './servico';

const DecisaoSchema = z
  .object({
    codigo: z.uuid(),
    tarefa: z.uuid(),
    decisao: z.enum(['aprovada', 'ajustes']),
    comentario: z.string().trim().max(2000),
  })
  .refine((valor) => valor.decisao !== 'ajustes' || valor.comentario.length >= 5, {
    path: ['comentario'],
    message: 'Explique o ajuste necessário.',
  });

export type EstadoPortalCliente = { erro?: string; sucesso?: string };

export async function decidirEntregaCliente(
  _estado: EstadoPortalCliente,
  formData: FormData,
): Promise<EstadoPortalCliente> {
  const validacao = DecisaoSchema.safeParse({
    codigo: formData.get('codigo'),
    tarefa: formData.get('tarefa'),
    decisao: formData.get('decisao'),
    comentario: formData.get('comentario') ?? '',
  });

  if (!validacao.success) {
    const comentario = validacao.error.issues.some((item) => item.path[0] === 'comentario');
    return {
      erro: comentario
        ? 'Conte brevemente o que precisa ser ajustado.'
        : 'Não foi possível identificar esta entrega.',
    };
  }

  try {
    const decidiu = await registrarDecisaoCliente({
      codigo: validacao.data.codigo,
      tarefaId: validacao.data.tarefa,
      decisao: validacao.data.decisao,
      comentario: validacao.data.comentario || null,
    });
    if (!decidiu) return { erro: 'Esta solicitação já foi respondida ou deixou de estar ativa.' };

    revalidatePath(`/portal/${validacao.data.codigo}`);
    return {
      sucesso:
        validacao.data.decisao === 'aprovada'
          ? 'Entrega aprovada. Obrigado pela confirmação.'
          : 'Pedido de ajuste enviado ao responsável pelo projeto.',
    };
  } catch (erro) {
    console.error(
      `[portal-cliente:acao] ${erro instanceof Error ? erro.message : 'erro_desconhecido'}`,
    );
    return { erro: 'Não foi possível registrar sua decisão agora. Tente novamente.' };
  }
}
