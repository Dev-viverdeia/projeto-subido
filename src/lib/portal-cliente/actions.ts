'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { registrarConclusaoDependenciaCliente, registrarDecisaoCliente } from './servico';
import { registrarDecisaoMudancaEscopo, registrarSolicitacaoMudancaEscopo } from './escopo-servico';

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

const SolicitarMudancaSchema = z.object({
  codigo: z.uuid(),
  titulo: z.string().trim().min(3).max(160),
  descricao: z.string().trim().min(10).max(4000),
});

const DecidirMudancaSchema = z.object({
  codigo: z.uuid(),
  mudanca: z.uuid(),
  decisao: z.enum(['aprovada', 'recusada']),
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
    const resultado = await registrarConclusaoDependenciaCliente({
      codigo: validacao.data.codigo,
      acaoId: validacao.data.acao,
    });
    if (!resultado.concluiu) {
      return { erro: 'Esta pendência já foi concluída ou deixou de estar ativa.' };
    }

    revalidatePath(`/portal/${validacao.data.codigo}`);
    return {
      sucesso:
        resultado.notificacao === 'falhou' || resultado.notificacao === 'indisponivel'
          ? 'Tudo certo. A confirmação ficou salva no projeto.'
          : 'Tudo certo. O responsável pelo projeto foi avisado.',
    };
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

export async function solicitarMudancaEscopoCliente(
  _estado: EstadoPortalCliente,
  formData: FormData,
): Promise<EstadoPortalCliente> {
  const validacao = SolicitarMudancaSchema.safeParse({
    codigo: formData.get('codigo'),
    titulo: formData.get('titulo'),
    descricao: formData.get('descricao'),
  });
  if (!validacao.success) {
    return { erro: 'Dê um nome ao pedido e explique o que precisa mudar.' };
  }

  try {
    const resultado = await registrarSolicitacaoMudancaEscopo(validacao.data);
    if (!resultado.solicitou) return { erro: 'Este portal não está mais disponível.' };

    revalidatePath(`/portal/${validacao.data.codigo}`);
    return {
      sucesso: 'Pedido enviado. Nada muda no projeto até a análise do responsável.',
      aviso:
        resultado.notificacao === 'falhou' || resultado.notificacao === 'indisponivel'
          ? 'O pedido está salvo mesmo que o aviso por e-mail demore.'
          : undefined,
    };
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : 'erro_desconhecido';
    if (mensagem.includes('mudanca_ativa_existente')) {
      return {
        erro: 'Já existe uma mudança em análise. Aguarde a resposta antes de enviar outra.',
      };
    }
    console.error(`[portal-cliente:mudanca] ${mensagem}`);
    return { erro: 'Não foi possível enviar o pedido agora. Tente novamente.' };
  }
}

export async function decidirMudancaEscopoCliente(
  _estado: EstadoPortalCliente,
  formData: FormData,
): Promise<EstadoPortalCliente> {
  const validacao = DecidirMudancaSchema.safeParse({
    codigo: formData.get('codigo'),
    mudanca: formData.get('mudanca'),
    decisao: formData.get('decisao'),
  });
  if (!validacao.success) return { erro: 'Não foi possível identificar esta mudança.' };

  try {
    const resultado = await registrarDecisaoMudancaEscopo({
      codigo: validacao.data.codigo,
      mudancaId: validacao.data.mudanca,
      decisao: validacao.data.decisao,
    });
    if (!resultado.decidiu) return { erro: 'Esta decisão já foi registrada.' };

    revalidatePath(`/portal/${validacao.data.codigo}`);
    return {
      sucesso:
        validacao.data.decisao === 'aprovada'
          ? 'Mudança aprovada. O novo combinado já está registrado.'
          : 'Tudo certo. O projeto segue pelo combinado original.',
      aviso:
        resultado.notificacao === 'falhou' || resultado.notificacao === 'indisponivel'
          ? 'Sua decisão está salva mesmo que o aviso por e-mail demore.'
          : undefined,
    };
  } catch (erro) {
    console.error(
      `[portal-cliente:decisao-mudanca] ${erro instanceof Error ? erro.message : 'erro_desconhecido'}`,
    );
    return { erro: 'Não foi possível registrar sua decisão agora. Tente novamente.' };
  }
}
