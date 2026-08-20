'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { handleError } from '@/lib/errors';
import { revalidarDirecaoOperacional } from './revalidacao';

/**
 * A única mutação do Consultor que não fala com o modelo: apagar uma conversa.
 * Server Action, como as do Builder — dura milissegundos, e a RLS é quem
 * autoriza: id alheio afeta zero linhas, sem revelar se existe.
 */

const Id = z.uuid();

const ConfirmarAcaoCrmSchema = z.object({
  mensagem: z.uuid(),
  acao: z.string().trim().min(3).max(500),
  quando: z.union([z.literal(''), z.iso.date()]),
});

const GerenciarAcaoCrmSchema = z
  .object({
    mensagem: z.uuid(),
    operacao: z.enum(['concluir', 'remarcar', 'substituir']),
    acao: z.preprocess((valor) => (valor === null ? '' : valor), z.string().trim().max(500)),
    quando: z.preprocess(
      (valor) => (valor === null ? '' : valor),
      z.union([z.literal(''), z.iso.date()]),
    ),
  })
  .superRefine((dados, contexto) => {
    if (dados.operacao === 'remarcar' && !dados.quando) {
      contexto.addIssue({ code: 'custom', path: ['quando'], message: 'Escolha a nova data.' });
    }
    if (dados.operacao === 'substituir' && dados.acao.length < 3) {
      contexto.addIssue({ code: 'custom', path: ['acao'], message: 'Descreva a nova ação.' });
    }
  });

const ConfirmarRecomendacaoCrmSchema = z.object({
  mensagem: z.uuid(),
  acao: z.string().trim().min(3).max(500),
  quando: z.union([z.literal(''), z.iso.date()]),
});

export type EstadoConfirmarAcaoCrm = {
  status?: 'erro' | 'sucesso';
  mensagem?: string;
  acao?: string;
  quando?: string | null;
};

export type EstadoGerenciarAcaoCrm = {
  status?: 'erro' | 'sucesso';
  mensagem?: string;
  operacao?: 'concluir' | 'remarcar' | 'substituir';
  acao?: string;
  quando?: string | null;
};

export type EstadoConfirmarRecomendacaoCrm = {
  status?: 'erro' | 'sucesso';
  mensagem?: string;
  acao?: string;
  quando?: string | null;
};

function revalidarOperacao(): void {
  revalidarDirecaoOperacional();
  revalidatePath('/crm');
  revalidatePath('/solucoes');
}

/**
 * Confirma uma orientação no lead que estava ligado à mensagem quando ela foi
 * gerada. O id da oportunidade não vem do formulário: a função do banco o lê
 * do snapshot protegido da própria resposta, evitando troca de alvo.
 */
export async function confirmarAcaoCrm(
  _estado: EstadoConfirmarAcaoCrm,
  formData: FormData,
): Promise<EstadoConfirmarAcaoCrm> {
  const validacao = ConfirmarAcaoCrmSchema.safeParse({
    mensagem: formData.get('mensagem'),
    acao: formData.get('acao'),
    quando: formData.get('quando'),
  });

  if (!validacao.success) {
    return {
      status: 'erro',
      mensagem: 'Revise a ação e escolha uma data válida.',
    };
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims) {
    return { status: 'erro', mensagem: 'Sua sessão expirou. Entre novamente para continuar.' };
  }

  const quando = validacao.data.quando ? `${validacao.data.quando}T12:00:00-03:00` : undefined;
  const { data, error } = await supabase.rpc('sobral_confirmar_acao_crm', {
    p_mensagem: validacao.data.mensagem,
    p_acao: validacao.data.acao,
    p_quando: quando,
  });

  if (error) {
    console.error(`[sobral:confirmar-acao] ${error.code}: ${error.message}`);
    return {
      status: 'erro',
      mensagem:
        error.code === '22023'
          ? 'A data precisa ser de hoje em diante.'
          : 'Não foi possível registrar a ação agora. Tente novamente.',
    };
  }

  if (!data) {
    return {
      status: 'erro',
      mensagem: 'Essa orientação não está mais ligada a uma oportunidade aberta.',
    };
  }

  revalidarOperacao();

  return {
    status: 'sucesso',
    mensagem: 'Ação registrada na venda e no plano do cliente.',
    acao: validacao.data.acao,
    quando: validacao.data.quando || null,
  };
}

/**
 * Move uma ação já confirmada sem confiar em ids ou estado enviados pelo
 * navegador. O banco recupera o lead e a versão atual pelo id da mensagem e
 * recusa a mutação quando outra ação mais nova já assumiu o CRM.
 */
export async function gerenciarAcaoCrm(
  _estado: EstadoGerenciarAcaoCrm,
  formData: FormData,
): Promise<EstadoGerenciarAcaoCrm> {
  const validacao = GerenciarAcaoCrmSchema.safeParse({
    mensagem: formData.get('mensagem'),
    operacao: formData.get('operacao'),
    acao: formData.get('acao'),
    quando: formData.get('quando'),
  });

  if (!validacao.success) {
    return {
      status: 'erro',
      mensagem: 'Revise os dados antes de confirmar este movimento.',
    };
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims) {
    return { status: 'erro', mensagem: 'Sua sessão expirou. Entre novamente para continuar.' };
  }

  const quando = validacao.data.quando ? `${validacao.data.quando}T12:00:00-03:00` : undefined;
  const { data, error } = await supabase.rpc('sobral_gerenciar_acao_crm', {
    p_mensagem: validacao.data.mensagem,
    p_operacao: validacao.data.operacao,
    p_acao: validacao.data.acao || undefined,
    p_quando: quando,
  });

  if (error) {
    console.error(`[sobral:gerenciar-acao] ${error.code}: ${error.message}`);
    return {
      status: 'erro',
      mensagem:
        error.code === '22023'
          ? 'A ação e a data precisam ser válidas e futuras.'
          : 'Não foi possível atualizar a ação agora. Tente novamente.',
    };
  }

  if (data === 'desatualizada') {
    return {
      status: 'erro',
      mensagem:
        'Outra ação já atualizou este cliente. Abra a ficha antes de decidir o próximo passo.',
    };
  }
  if (data === 'indisponivel' || data === 'nao_encontrada') {
    return {
      status: 'erro',
      mensagem: 'Esta ação não está mais disponível para atualização.',
    };
  }
  if (data === 'sem_alteracao') {
    return {
      status: 'erro',
      mensagem: 'A ação e a data continuam iguais. Faça um ajuste antes de salvar.',
    };
  }
  if (data === 'ja_concluida') {
    revalidarOperacao();
    return {
      status: 'sucesso',
      mensagem: 'Esta ação já estava concluída.',
      operacao: 'concluir',
    };
  }

  revalidarOperacao();

  return {
    status: 'sucesso',
    mensagem:
      validacao.data.operacao === 'concluir'
        ? 'Ação concluída e removida das pendências do lead.'
        : validacao.data.operacao === 'remarcar'
          ? 'Nova data registrada na venda e no plano.'
          : 'Próxima ação substituída na venda e no plano.',
    operacao: validacao.data.operacao,
    acao: validacao.data.acao || undefined,
    quando: validacao.data.quando || null,
  };
}

/**
 * Confirma uma recomendação pós-conclusão. A oportunidade continua presa ao
 * comprovante da mensagem; ação e data são as únicas escolhas do formulário.
 * O banco recusa a escrita se outro compromisso já tiver assumido o lead.
 */
export async function confirmarRecomendacaoCrm(
  _estado: EstadoConfirmarRecomendacaoCrm,
  formData: FormData,
): Promise<EstadoConfirmarRecomendacaoCrm> {
  const validacao = ConfirmarRecomendacaoCrmSchema.safeParse({
    mensagem: formData.get('mensagem'),
    acao: formData.get('acao'),
    quando: formData.get('quando'),
  });

  if (!validacao.success) {
    return { status: 'erro', mensagem: 'Revise a ação e escolha uma data válida.' };
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims) {
    return { status: 'erro', mensagem: 'Sua sessão expirou. Entre novamente para continuar.' };
  }

  const quando = validacao.data.quando ? `${validacao.data.quando}T12:00:00-03:00` : undefined;
  const { data, error } = await supabase.rpc('sobral_confirmar_recomendacao_crm', {
    p_mensagem: validacao.data.mensagem,
    p_acao: validacao.data.acao,
    p_quando: quando,
  });

  if (error) {
    console.error(`[sobral:confirmar-recomendacao] ${error.code}: ${error.message}`);
    return {
      status: 'erro',
      mensagem:
        error.code === '22023'
          ? 'A ação e a data precisam ser válidas e futuras.'
          : 'Não foi possível registrar o próximo passo agora. Tente novamente.',
    };
  }

  if (data === 'desatualizada') {
    return {
      status: 'erro',
      mensagem: 'A venda já recebeu outro compromisso. Abra a ficha antes de confirmar esta ação.',
    };
  }
  if (data === 'indisponivel' || data === 'nao_encontrada') {
    return { status: 'erro', mensagem: 'Esta recomendação não está mais disponível.' };
  }
  if (data === 'ja_confirmada') {
    revalidarOperacao();
    return { status: 'sucesso', mensagem: 'Este próximo passo já estava na venda.' };
  }

  revalidarOperacao();
  return {
    status: 'sucesso',
    mensagem: 'Novo próximo passo registrado na venda e no plano.',
    acao: validacao.data.acao,
    quando: validacao.data.quando || null,
  };
}

export async function apagarConversa(formData: FormData): Promise<void> {
  const id = Id.safeParse(formData.get('id'));
  if (!id.success) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from('consultor_threads').delete().eq('id', id.data);
  if (error) throw handleError(error, 'consultor:apagar');

  revalidatePath('/consultor');
  /* `redirect` lança por dentro — fica FORA de qualquer try/catch. */
  redirect('/consultor');
}
