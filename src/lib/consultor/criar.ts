'use client';

import { createClient } from '@/lib/supabase/client';
import { categoriaDoAnexo, validarAnexosSobral } from './anexos-contrato';

/** Mesmo corte do título usado desde a primeira versão: legível e sem quebrar
 * a lista de conversas. Quando o turno contém só arquivo, o nome vira o título. */
function tituloDa(mensagem: string, arquivos: readonly File[]): string {
  const origem = mensagem.trim() || `Análise de ${arquivos[0]?.name ?? 'arquivo'}`;
  const bruto = origem.replace(/\s+/g, ' ').trim();
  if (bruto.length <= 80) return bruto;
  const corte = bruto.slice(0, 80);
  const espaco = corte.lastIndexOf(' ');
  return `${espaco > 48 ? corte.slice(0, espaco) : corte}…`;
}

function conteudoDaMensagem(mensagem: string, arquivos: readonly File[]): string {
  const texto = mensagem.trim();
  if (texto) return texto;
  if (arquivos.length === 1 && categoriaDoAnexo(arquivos[0]!.type) === 'audio') {
    return 'Áudio enviado.';
  }
  if (arquivos.length === 1) return `Analise o arquivo ${arquivos[0]!.name}.`;
  return `Analise estes ${arquivos.length} arquivos e me ajude com o que encontrar.`;
}

type ResultadoRegistro =
  | { threadId: string; mensagemId: string; falha: null }
  | { threadId: null; mensagemId: null; falha: string };

export async function criarConversa(
  mensagem: string,
  arquivos: readonly File[] = [],
): Promise<ResultadoRegistro> {
  return registrarMensagem({ mensagem, arquivos, nova: true });
}

export async function adicionarMensagem(
  threadId: string,
  mensagem: string,
  arquivos: readonly File[] = [],
): Promise<ResultadoRegistro> {
  return registrarMensagem({ mensagem, arquivos, nova: false, threadId });
}

async function registrarMensagem({
  mensagem,
  arquivos,
  nova,
  threadId,
}: {
  mensagem: string;
  arquivos: readonly File[];
  nova: boolean;
  threadId?: string;
}): Promise<ResultadoRegistro> {
  const falhaValidacao = validarAnexosSobral(arquivos);
  if (falhaValidacao) return { threadId: null, mensagemId: null, falha: falhaValidacao };
  if (!mensagem.trim() && arquivos.length === 0) {
    return { threadId: null, mensagemId: null, falha: 'Escreva uma mensagem ou envie um arquivo.' };
  }

  if (arquivos.length > 0) {
    const { EnvioAnexos } = await import('./envio-anexos');
    const resultado = await new EnvioAnexos(
      mensagem,
      arquivos,
      threadId,
      () => undefined,
    ).executar();
    return resultado.threadId && !resultado.falha
      ? { threadId: resultado.threadId, mensagemId: resultado.mensagemId, falha: null }
      : {
          threadId: null,
          mensagemId: null,
          falha: resultado.falha ?? 'Não foi possível confirmar o envio.',
        };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { threadId: null, mensagemId: null, falha: 'Faça login para usar o Sobral AI.' };
  }

  let conversaId = threadId;
  if (nova) {
    const { data: thread, error } = await supabase
      .from('consultor_threads')
      .insert({ dono: user.id, titulo: tituloDa(mensagem, arquivos) })
      .select('id')
      .single();
    if (error || !thread) {
      return { threadId: null, mensagemId: null, falha: 'Não foi possível iniciar a conversa.' };
    }
    conversaId = thread.id;
  }

  if (!conversaId) {
    return { threadId: null, mensagemId: null, falha: 'Conversa não encontrada.' };
  }

  const { data: mensagemCriada, error: erroMensagem } = await supabase
    .from('consultor_mensagens')
    .insert({
      thread_id: conversaId,
      papel: 'usuario',
      conteudo: conteudoDaMensagem(mensagem, arquivos),
    })
    .select('id')
    .single();

  if (erroMensagem || !mensagemCriada) {
    if (nova) await supabase.from('consultor_threads').delete().eq('id', conversaId);
    return { threadId: null, mensagemId: null, falha: 'Não foi possível enviar a mensagem.' };
  }

  return { threadId: conversaId, mensagemId: mensagemCriada.id, falha: null };
}
