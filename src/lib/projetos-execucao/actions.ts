'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { revalidarDirecaoOperacional } from '@/lib/consultor/revalidacao';
import { createClient } from '@/lib/supabase/server';
import { lerBriefingKickoff } from './briefing';
import { validarAtualizacaoTarefa } from './validacao-tarefa';

const IniciarSchema = z.object({ proposta: z.uuid() });
const TarefaSchema = z.object({
  projeto: z.uuid(),
  tarefa: z.uuid(),
  status: z.enum(['pendente', 'em_andamento', 'concluida', 'bloqueada']),
  evidencia: z.string().trim().max(10_000),
  criterioConfirmado: z.preprocess((valor) => valor === 'sim', z.boolean()),
});

const PrazoSchema = z.object({
  projeto: z.uuid(),
  prazo: z.preprocess(
    (valor) => (typeof valor === 'string' && valor.length ? valor : null),
    z.iso.date().nullable(),
  ),
});

const PortalSchema = z.object({
  projeto: z.uuid(),
  operacao: z.enum(['ativar', 'desativar', 'renovar']),
});

const EntregaClienteSchema = z.object({
  projeto: z.uuid(),
  tarefa: z.uuid(),
  operacao: z.enum(['salvar', 'solicitar']),
  nota: z.string().trim().max(4000),
  url: z
    .string()
    .trim()
    .max(2048)
    .refine((valor) => !valor || /^https?:\/\/[^\s]+$/i.test(valor), 'Link inválido.'),
});

const ArquivoSchema = z.object({
  projeto: z.uuid(),
  tarefa: z.uuid().nullable(),
  grupo: z.uuid().nullable(),
  titulo: z.string().trim().min(2).max(180),
  descricao: z.string().trim().max(2000),
  nome: z.string().trim().min(1).max(240),
  caminho: z.string().trim().min(10).max(1000),
  mimeType: z.string().trim().min(1).max(180),
  tamanho: z.number().int().positive().max(52_428_800),
});

const ArquivoOperacaoSchema = z.object({
  projeto: z.uuid(),
  arquivo: z.uuid(),
});

const ArquivoVisibilidadeSchema = ArquivoOperacaoSchema.extend({ visivel: z.boolean() });

export type EstadoProjetoExecucao = { erro?: string; sucesso?: string };

export type EntradaArquivoProjeto = z.input<typeof ArquivoSchema>;

async function usuarioAtual() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function iniciarProjetoExecucao(
  _estado: EstadoProjetoExecucao,
  formData: FormData,
): Promise<EstadoProjetoExecucao> {
  const validacao = IniciarSchema.safeParse({ proposta: formData.get('proposta') });
  if (!validacao.success) return { erro: 'Não foi possível identificar esta proposta.' };

  const { supabase, user } = await usuarioAtual();
  if (!user) return { erro: 'Sua sessão expirou. Entre novamente para continuar.' };

  const { data, error } = await supabase.rpc('projeto_iniciar', {
    p_proposta_id: validacao.data.proposta,
  });

  if (error || !data) {
    console.error(
      `[projetos-execucao:iniciar] ${error?.code ?? 'sem-dados'}: ${error?.message ?? ''}`,
    );
    return {
      erro:
        error?.message === 'proposta_precisa_estar_aceita'
          ? 'A proposta precisa estar aceita antes de iniciar a entrega.'
          : 'Não foi possível abrir a entrega agora.',
    };
  }

  revalidatePath('/propostas');
  revalidatePath(`/propostas/${validacao.data.proposta}`);
  revalidatePath('/entregas');
  revalidarDirecaoOperacional();
  redirect(`/entregas/${data}`);
}

export async function atualizarTarefaProjeto(
  _estado: EstadoProjetoExecucao,
  formData: FormData,
): Promise<EstadoProjetoExecucao> {
  const validacao = TarefaSchema.safeParse({
    projeto: formData.get('projeto'),
    tarefa: formData.get('tarefa'),
    status: formData.get('status'),
    evidencia: formData.get('evidencia') ?? '',
    criterioConfirmado: formData.get('criterioConfirmado'),
  });
  if (!validacao.success) return { erro: 'Revise a atualização desta tarefa.' };
  const erroValidacao = validarAtualizacaoTarefa({
    status: validacao.data.status,
    registro: validacao.data.evidencia,
    criterioConfirmado: validacao.data.criterioConfirmado,
  });
  if (erroValidacao) return { erro: erroValidacao };

  const { supabase, user } = await usuarioAtual();
  if (!user) return { erro: 'Sua sessão expirou. Entre novamente para continuar.' };

  const { data, error } = await supabase
    .from('projeto_tarefas')
    .update({
      status: validacao.data.status,
      evidencia: validacao.data.evidencia || null,
    })
    .eq('id', validacao.data.tarefa)
    .eq('projeto_execucao_id', validacao.data.projeto)
    .select('id')
    .maybeSingle();

  if (error || !data) {
    console.error(
      `[projetos-execucao:tarefa] ${error?.code ?? 'sem-dados'}: ${error?.message ?? ''}`,
    );
    return { erro: 'Não foi possível atualizar esta tarefa agora.' };
  }

  revalidatePath(`/entregas/${validacao.data.projeto}`);
  revalidatePath('/entregas');
  revalidarDirecaoOperacional();
  return { sucesso: 'Tarefa atualizada.' };
}

export async function definirPrazoProjeto(
  _estado: EstadoProjetoExecucao,
  formData: FormData,
): Promise<EstadoProjetoExecucao> {
  const validacao = PrazoSchema.safeParse({
    projeto: formData.get('projeto'),
    prazo: formData.get('prazo'),
  });
  if (!validacao.success) return { erro: 'Informe uma data válida.' };

  const { supabase, user } = await usuarioAtual();
  if (!user) return { erro: 'Sua sessão expirou. Entre novamente para continuar.' };

  const { data, error } = await supabase
    .from('projetos_execucao')
    .update({
      prazo_em: validacao.data.prazo ? `${validacao.data.prazo}T12:00:00.000Z` : null,
    })
    .eq('id', validacao.data.projeto)
    .select('id')
    .maybeSingle();

  if (error || !data) {
    console.error(
      `[projetos-execucao:prazo] ${error?.code ?? 'sem-dados'}: ${error?.message ?? ''}`,
    );
    return { erro: 'Não foi possível salvar o prazo.' };
  }

  revalidatePath(`/entregas/${validacao.data.projeto}`);
  revalidatePath('/entregas');
  revalidarDirecaoOperacional();
  return { sucesso: 'Prazo atualizado.' };
}

export async function configurarPortalCliente(
  _estado: EstadoProjetoExecucao,
  formData: FormData,
): Promise<EstadoProjetoExecucao> {
  const validacao = PortalSchema.safeParse({
    projeto: formData.get('projeto'),
    operacao: formData.get('operacao'),
  });
  if (!validacao.success) return { erro: 'Não foi possível configurar o portal.' };

  const { supabase, user } = await usuarioAtual();
  if (!user) return { erro: 'Sua sessão expirou. Entre novamente para continuar.' };

  if (validacao.data.operacao === 'ativar') {
    const { data: projeto, error: erroProjeto } = await supabase
      .from('projetos_execucao')
      .select('briefing_kickoff')
      .eq('id', validacao.data.projeto)
      .eq('dono', user.id)
      .maybeSingle();
    if (erroProjeto || !projeto) return { erro: 'Este projeto não está disponível.' };
    if (!lerBriefingKickoff(projeto.briefing_kickoff)?.confirmadoEm) {
      return { erro: 'Confirme o acordo operacional antes de ativar o portal.' };
    }
  }

  const agora = new Date().toISOString();
  const alteracao =
    validacao.data.operacao === 'desativar'
      ? { portal_ativo: false }
      : validacao.data.operacao === 'renovar'
        ? { portal_ativo: true, portal_codigo: randomUUID(), portal_ativado_em: agora }
        : { portal_ativo: true, portal_ativado_em: agora };

  const { data, error } = await supabase
    .from('projetos_execucao')
    .update(alteracao)
    .eq('id', validacao.data.projeto)
    .eq('dono', user.id)
    .select('portal_codigo')
    .maybeSingle();

  if (error || !data) {
    console.error(
      `[projetos-execucao:portal] ${error?.code ?? 'sem-dados'}: ${error?.message ?? ''}`,
    );
    return { erro: 'Não foi possível configurar o portal agora.' };
  }

  revalidatePath(`/entregas/${validacao.data.projeto}`);
  revalidatePath(`/portal/${data.portal_codigo}`);
  revalidarDirecaoOperacional();
  return {
    sucesso:
      validacao.data.operacao === 'desativar'
        ? 'Portal pausado.'
        : validacao.data.operacao === 'renovar'
          ? 'Novo link criado. O anterior deixou de funcionar.'
          : 'Portal do cliente ativado.',
  };
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
    url: formData.get('url') ?? '',
  });
  if (!validacao.success) {
    const linkInvalido = validacao.error.issues.some((item) => item.path[0] === 'url');
    return {
      erro: linkInvalido ? 'Use um link completo começando com http.' : 'Revise a entrega.',
    };
  }

  const { supabase, user } = await usuarioAtual();
  if (!user) return { erro: 'Sua sessão expirou. Entre novamente para continuar.' };

  const { data: projeto, error: erroProjeto } = await supabase
    .from('projetos_execucao')
    .select('portal_ativo, portal_codigo')
    .eq('id', validacao.data.projeto)
    .eq('dono', user.id)
    .maybeSingle();

  if (erroProjeto || !projeto) return { erro: 'Este projeto não está disponível.' };
  if (validacao.data.operacao === 'solicitar' && !projeto.portal_ativo) {
    return { erro: 'Ative o Portal do Cliente antes de solicitar a aprovação.' };
  }

  const atualizacao = {
    cliente_nota: validacao.data.nota || null,
    entregavel_url: validacao.data.url || null,
    ...(validacao.data.operacao === 'solicitar' ? { cliente_status: 'aguardando' as const } : {}),
  };

  let consulta = supabase
    .from('projeto_tarefas')
    .update(atualizacao)
    .eq('id', validacao.data.tarefa)
    .eq('projeto_execucao_id', validacao.data.projeto)
    .eq('dono', user.id);
  if (validacao.data.operacao === 'solicitar') consulta = consulta.eq('status', 'concluida');

  const { data, error } = await consulta.select('id').maybeSingle();
  if (error || !data) {
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

  revalidatePath(`/entregas/${validacao.data.projeto}`);
  revalidatePath(`/portal/${projeto.portal_codigo}`);
  revalidarDirecaoOperacional();
  return {
    sucesso:
      validacao.data.operacao === 'solicitar'
        ? 'Entrega enviada para aprovação.'
        : 'Apresentação do cliente salva.',
  };
}

export async function registrarArquivoProjeto(
  entrada: EntradaArquivoProjeto,
): Promise<EstadoProjetoExecucao> {
  const validacao = ArquivoSchema.safeParse(entrada);
  if (!validacao.success) return { erro: 'Revise o nome e os dados deste arquivo.' };

  const { supabase, user } = await usuarioAtual();
  if (!user) return { erro: 'Sua sessão expirou. Entre novamente para continuar.' };

  const dados = validacao.data;
  const { data, error } = await supabase.rpc('projeto_arquivo_registrar', {
    p_projeto_id: dados.projeto,
    p_tarefa_id: dados.tarefa as string,
    p_grupo_id: dados.grupo as string,
    p_titulo: dados.titulo,
    p_descricao: dados.descricao,
    p_nome_original: dados.nome,
    p_caminho_storage: dados.caminho,
    p_mime_type: dados.mimeType,
    p_tamanho_bytes: dados.tamanho,
  });

  if (error || !data) {
    console.error(
      `[projetos-execucao:arquivo-registrar] ${error?.code ?? 'sem-dados'}: ${error?.message ?? ''}`,
    );
    return { erro: 'O envio terminou, mas não foi possível registrar o arquivo.' };
  }

  revalidatePath(`/entregas/${dados.projeto}`);
  revalidarDirecaoOperacional();
  return { sucesso: dados.grupo ? `Versão ${data.versao} adicionada.` : 'Arquivo adicionado.' };
}

export async function definirVisibilidadeArquivoProjeto(
  entrada: z.input<typeof ArquivoVisibilidadeSchema>,
): Promise<EstadoProjetoExecucao> {
  const validacao = ArquivoVisibilidadeSchema.safeParse(entrada);
  if (!validacao.success) return { erro: 'Não foi possível identificar este arquivo.' };

  const { supabase, user } = await usuarioAtual();
  if (!user) return { erro: 'Sua sessão expirou. Entre novamente para continuar.' };

  const { data: projeto } = await supabase
    .from('projetos_execucao')
    .select('portal_codigo')
    .eq('id', validacao.data.projeto)
    .eq('dono', user.id)
    .maybeSingle();
  const { data: arquivo } = await supabase
    .from('projeto_arquivos')
    .select('id')
    .eq('id', validacao.data.arquivo)
    .eq('projeto_execucao_id', validacao.data.projeto)
    .maybeSingle();
  if (!projeto || !arquivo) return { erro: 'Este arquivo não está disponível.' };

  const { data, error } = await supabase.rpc('projeto_arquivo_definir_visibilidade', {
    p_arquivo_id: validacao.data.arquivo,
    p_visivel: validacao.data.visivel,
  });
  if (error || !data) {
    console.error(
      `[projetos-execucao:arquivo-visibilidade] ${error?.code ?? 'sem-dados'}: ${error?.message ?? ''}`,
    );
    return { erro: 'Não foi possível atualizar a liberação ao cliente.' };
  }

  revalidatePath(`/entregas/${validacao.data.projeto}`);
  revalidatePath(`/portal/${projeto.portal_codigo}`);
  revalidarDirecaoOperacional();
  return {
    sucesso: validacao.data.visivel
      ? 'Esta versão foi liberada ao cliente.'
      : 'O arquivo voltou a ficar somente interno.',
  };
}

export async function excluirArquivoProjeto(
  entrada: z.input<typeof ArquivoOperacaoSchema>,
): Promise<EstadoProjetoExecucao> {
  const validacao = ArquivoOperacaoSchema.safeParse(entrada);
  if (!validacao.success) return { erro: 'Não foi possível identificar este arquivo.' };

  const { supabase, user } = await usuarioAtual();
  if (!user) return { erro: 'Sua sessão expirou. Entre novamente para continuar.' };

  const { data: arquivo, error: erroArquivo } = await supabase
    .from('projeto_arquivos')
    .select('caminho_storage, visivel_cliente')
    .eq('id', validacao.data.arquivo)
    .eq('projeto_execucao_id', validacao.data.projeto)
    .maybeSingle();
  if (erroArquivo || !arquivo) return { erro: 'Este arquivo não está disponível.' };
  if (arquivo.visivel_cliente) {
    return { erro: 'Retire o arquivo do Portal do Cliente antes de excluí-lo.' };
  }

  const { error: erroStorage } = await supabase.storage
    .from('projeto-entregaveis')
    .remove([arquivo.caminho_storage]);
  if (erroStorage) {
    console.error(`[projetos-execucao:arquivo-storage] ${erroStorage.message}`);
    return { erro: 'Não foi possível remover o arquivo do cofre.' };
  }

  const { error } = await supabase
    .from('projeto_arquivos')
    .delete()
    .eq('id', validacao.data.arquivo)
    .eq('projeto_execucao_id', validacao.data.projeto)
    .eq('dono', user.id);
  if (error) {
    console.error(`[projetos-execucao:arquivo-excluir] ${error.code}: ${error.message}`);
    return { erro: 'O arquivo foi removido do cofre, mas a lista não pôde ser atualizada.' };
  }

  revalidatePath(`/entregas/${validacao.data.projeto}`);
  revalidarDirecaoOperacional();
  return { sucesso: 'Versão excluída.' };
}
