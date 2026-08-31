'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { registrarConclusaoDependenciaCliente, registrarDecisaoCliente } from './servico';

const DecisaoSchema = z
  .object({
    codigo: z.uuid(),
    tarefa: z.uuid(),
    decisao: z.enum(['aprovada', 'ajustes']),
    comentario: z.string().trim().max(2000),
    final: z.enum(['sim', 'nao']).default('nao'),
  })
  .refine((valor) => valor.decisao !== 'ajustes' || valor.comentario.length >= 5, {
    path: ['comentario'],
    message: 'Explique o ajuste necessário.',
  });

export type EstadoPortalCliente = { erro?: string; sucesso?: string; aviso?: string };

const PendenciaSchema = z.object({
  codigo: z.uuid(),
  acao: z.uuid(),
});

export async function concluirPendenciaCliente(
  _estado: EstadoPortalCliente,
  formData: FormData,
): Promise<EstadoPortalCliente> {
  const validacao = PendenciaSchema.safeParse({
    codigo: formData.get('codigo'),
    acao: formData.get('acao'),
  });
  if (!validacao.success) return { erro: 'Não foi possível identificar esta pendência.' };

  try {
    const concluiu = await registrarConclusaoDependenciaCliente({
      codigo: validacao.data.codigo,
      acaoId: validacao.data.acao,
    });
    if (!concluiu) return { erro: 'Esta pendência já foi concluída ou deixou de estar ativa.' };

    revalidatePath(`/portal/${validacao.data.codigo}`);
    return { sucesso: 'Tudo certo. O responsável pelo projeto já pode ver sua confirmação.' };
  } catch (erro) {
    console.error(
      `[portal-cliente:pendencia] ${erro instanceof Error ? erro.message : 'erro_desconhecido'}`,
    );
    return { erro: 'Não foi possível confirmar agora. Tente novamente.' };
  }
}

export async function decidirEntregaCliente(
  _estado: EstadoPortalCliente,
  formData: FormData,
): Promise<EstadoPortalCliente> {
  const validacao = DecisaoSchema.safeParse({
    codigo: formData.get('codigo'),
    tarefa: formData.get('tarefa'),
    decisao: formData.get('decisao'),
    comentario: formData.get('comentario') ?? '',
    final: formData.get('final') ?? 'nao',
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
    const resultado = await registrarDecisaoCliente({
      codigo: validacao.data.codigo,
      tarefaId: validacao.data.tarefa,
      decisao: validacao.data.decisao,
      comentario: validacao.data.comentario || null,
    });
    if (!resultado.decidiu) {
      return { erro: 'Esta solicitação já foi respondida ou deixou de estar ativa.' };
    }

    revalidatePath(`/portal/${validacao.data.codigo}`);
    return {
      sucesso:
        validacao.data.decisao === 'aprovada'
          ? validacao.data.final === 'sim'
            ? 'Aceite final registrado. O projeto foi concluído.'
            : 'Entrega aprovada. Obrigado pela confirmação.'
          : 'Pedido de ajuste enviado ao responsável pelo projeto.',
      aviso:
        resultado.notificacao === 'falhou' || resultado.notificacao === 'indisponivel'
          ? 'Sua decisão está salva. O responsável verá o retorno na plataforma mesmo que o aviso por e-mail demore.'
          : undefined,
    };
  } catch (erro) {
    console.error(
      `[portal-cliente:acao] ${erro instanceof Error ? erro.message : 'erro_desconhecido'}`,
    );
    return { erro: 'Não foi possível registrar sua decisão agora. Tente novamente.' };
  }
}
