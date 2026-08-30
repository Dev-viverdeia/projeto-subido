'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { revalidarDirecaoOperacional } from '@/lib/consultor/revalidacao';
import { env } from '@/lib/env';
import { enviarNotificacaoEntrega } from '@/lib/notificacoes/entrega';
import { emailValidacaoSolicitada } from '@/lib/notificacoes/entrega-email';
import { lerDocumentoProposta } from '@/lib/propostas/schema';
import { createClient } from '@/lib/supabase/server';
import type { EstadoProjetoExecucao } from './actions';

const EntregaClienteSchema = z
  .object({
    projeto: z.uuid(),
    tarefa: z.uuid(),
    operacao: z.enum(['salvar', 'solicitar']),
    nota: z.string().trim().max(4000),
    email: z.preprocess(
      (valor) => (typeof valor === 'string' && valor.trim() ? valor.trim() : null),
      z.union([z.email().max(320), z.null()]),
    ),
    url: z
      .string()
      .trim()
      .max(2048)
      .refine((valor) => !valor || /^https?:\/\/[^\s]+$/i.test(valor), 'Link inválido.'),
  })
  .refine((valor) => valor.operacao !== 'solicitar' || Boolean(valor.email), {
    path: ['email'],
    message: 'Informe o e-mail do cliente.',
  });

const ReenviarNotificacaoSchema = z.object({
  projeto: z.uuid(),
  evento: z.uuid(),
  email: z.email().max(320),
});

async function usuarioAtual() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function nomeDoProfissional(user: {
  email?: string | null;
  user_metadata?: { full_name?: unknown };
}) {
  return typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim()
    ? user.user_metadata.full_name.trim()
    : user.email?.split('@')[0] || 'Responsável pelo projeto';
}

export async function prepararEntregaCliente(
  _estado: EstadoProjetoExecucao,
  formData: FormData,
): Promise<EstadoProjetoExecucao> {
  const validacao = EntregaClienteSchema.safeParse({
    projeto: formData.get('projeto'),
    tarefa: formData.get('tarefa'),
    operacao: formData.get('operacao'),
    nota: formData.get('nota') ?? '',
    email: formData.get('email'),
    url: formData.get('url') ?? '',
  });
  if (!validacao.success) {
    const linkInvalido = validacao.error.issues.some((item) => item.path[0] === 'url');
    const emailInvalido = validacao.error.issues.some((item) => item.path[0] === 'email');
    return {
      erro: linkInvalido
        ? 'Use um link completo começando com http.'
        : emailInvalido
          ? 'Informe um e-mail válido para avisar o cliente.'
          : 'Revise a entrega.',
    };
  }

  const { supabase, user } = await usuarioAtual();
  if (!user) return { erro: 'Sua sessão expirou. Entre novamente para continuar.' };

  const { data: projeto, error: erroProjeto } = await supabase
    .from('projetos_execucao')
    .select('titulo, documento, portal_ativo, portal_codigo')
    .eq('id', validacao.data.projeto)
    .eq('dono', user.id)
    .maybeSingle();

  if (erroProjeto || !projeto) return { erro: 'Este projeto não está disponível.' };
  if (validacao.data.operacao === 'solicitar' && !projeto.portal_ativo) {
    return { erro: 'Ative o Portal do Cliente antes de solicitar a aprovação.' };
  }

  let consulta = supabase
    .from('projeto_tarefas')
    .update({
      cliente_nota: validacao.data.nota || null,
      entregavel_url: validacao.data.url || null,
      ...(validacao.data.operacao === 'solicitar' ? { cliente_status: 'aguardando' as const } : {}),
    })
    .eq('id', validacao.data.tarefa)
    .eq('projeto_execucao_id', validacao.data.projeto)
    .eq('dono', user.id);
  if (validacao.data.operacao === 'solicitar') consulta = consulta.eq('status', 'concluida');

  const { data: tarefa, error } = await consulta.select('id, titulo').maybeSingle();
  if (error || !tarefa) {
    console.error(
      `[projetos-execucao:entrega-cliente] ${error?.code ?? 'sem-dados'}: ${error?.message ?? ''}`,
    );
    return {
      erro:
        validacao.data.operacao === 'solicitar'
          ? 'Conclua a tarefa antes de pedir a aprovação.'
          : 'Não foi possível salvar esta apresentação agora.',
    };
  }

  let notificacao: Awaited<ReturnType<typeof enviarNotificacaoEntrega>> | null = null;
  if (validacao.data.operacao === 'solicitar' && validacao.data.email) {
    const documento = lerDocumentoProposta(projeto.documento);
    const { data: evento, error: erroEvento } = await supabase
      .from('projeto_portal_eventos')
      .select('id')
      .eq('projeto_execucao_id', validacao.data.projeto)
      .eq('tarefa_id', validacao.data.tarefa)
      .eq('tipo', 'aprovacao_solicitada')
      .order('criado_em', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (erroEvento || !evento || !documento) {
      console.error(
        `[projetos-execucao:notificacao] ${erroEvento?.code ?? 'contexto-incompleto'}: ${erroEvento?.message ?? ''}`,
      );
    } else {
      notificacao = await enviarNotificacaoEntrega({
        eventoId: evento.id,
        destinatario: validacao.data.email,
        responderPara: user.email,
        conteudo: emailValidacaoSolicitada({
          empresa: documento.cliente.empresa,
          projeto: projeto.titulo,
          tarefa: tarefa.titulo,
          profissional: nomeDoProfissional(user),
          nota: validacao.data.nota || null,
          link: `${env.NEXT_PUBLIC_SITE_URL}/portal/${projeto.portal_codigo}`,
        }),
      });
    }
  }

  revalidatePath(`/entregas/${validacao.data.projeto}`);
  revalidatePath(`/portal/${projeto.portal_codigo}`);
  revalidarDirecaoOperacional();
  const emailEnviado = ['enviada', 'ja_enviada'].includes(notificacao?.status ?? '');
  return {
    sucesso:
      validacao.data.operacao === 'solicitar'
        ? emailEnviado
          ? `Validação enviada para ${validacao.data.email}.`
          : 'A validação foi registrada no portal.'
        : 'Apresentação do cliente salva.',
    aviso:
      validacao.data.operacao === 'solicitar' && !emailEnviado
        ? 'O e-mail não foi entregue. Você pode corrigir o endereço e tentar novamente sem perder a validação.'
        : undefined,
  };
}

export async function reenviarNotificacaoEntregaCliente(
  _estado: EstadoProjetoExecucao,
  formData: FormData,
): Promise<EstadoProjetoExecucao> {
  const emailInformado = formData.get('email');
  const validacao = ReenviarNotificacaoSchema.safeParse({
    projeto: formData.get('projeto'),
    evento: formData.get('evento'),
    email: typeof emailInformado === 'string' ? emailInformado.trim() : null,
  });
  if (!validacao.success) return { erro: 'Informe um e-mail válido para tentar novamente.' };

  const { supabase, user } = await usuarioAtual();
  if (!user) return { erro: 'Sua sessão expirou. Entre novamente para continuar.' };

  const [{ data: evento, error: erroEvento }, { data: projeto, error: erroProjeto }] =
    await Promise.all([
      supabase
        .from('projeto_portal_eventos')
        .select('id, tarefa_id, tipo')
        .eq('id', validacao.data.evento)
        .eq('projeto_execucao_id', validacao.data.projeto)
        .eq('dono', user.id)
        .maybeSingle(),
      supabase
        .from('projetos_execucao')
        .select('titulo, documento, portal_ativo, portal_codigo')
        .eq('id', validacao.data.projeto)
        .eq('dono', user.id)
        .maybeSingle(),
    ]);

  if (
    erroEvento ||
    erroProjeto ||
    !evento?.tarefa_id ||
    evento.tipo !== 'aprovacao_solicitada' ||
    !projeto?.portal_ativo
  ) {
    return { erro: 'Esta notificação não está mais disponível para reenvio.' };
  }

  const { data: tarefa } = await supabase
    .from('projeto_tarefas')
    .select('titulo, cliente_nota')
    .eq('id', evento.tarefa_id)
    .eq('projeto_execucao_id', validacao.data.projeto)
    .maybeSingle();
  const documento = lerDocumentoProposta(projeto.documento);
  if (!tarefa || !documento) return { erro: 'Não foi possível reconstruir esta notificação.' };

  const resultado = await enviarNotificacaoEntrega({
    eventoId: evento.id,
    destinatario: validacao.data.email,
    responderPara: user.email,
    conteudo: emailValidacaoSolicitada({
      empresa: documento.cliente.empresa,
      projeto: projeto.titulo,
      tarefa: tarefa.titulo,
      profissional: nomeDoProfissional(user),
      nota: tarefa.cliente_nota,
      link: `${env.NEXT_PUBLIC_SITE_URL}/portal/${projeto.portal_codigo}`,
    }),
  });

  revalidatePath(`/entregas/${validacao.data.projeto}`);
  return resultado.status === 'falhou'
    ? {
        erro: 'O e-mail ainda não saiu. A validação continua segura no portal; tente novamente em instantes.',
      }
    : { sucesso: `E-mail enviado para ${validacao.data.email}.` };
}
