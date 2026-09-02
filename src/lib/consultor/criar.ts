'use client';

import { createClient } from '@/lib/supabase/client';
import {
  categoriaDoAnexo,
  mimeBaseDoAnexo,
  nomeSeguroParaStorage,
  SOBRAL_BUCKET_ANEXOS,
  validarAnexosSobral,
} from './anexos-contrato';

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

  if (arquivos.length === 0) {
    return { threadId: conversaId, mensagemId: mensagemCriada.id, falha: null };
  }

  const caminhosEnviados: string[] = [];
  try {
    const linhas = [];
    for (const arquivo of arquivos) {
      const categoria = categoriaDoAnexo(arquivo.type);
      if (!categoria) throw new Error('tipo-nao-suportado');
      const tipoMime = mimeBaseDoAnexo(arquivo.type);

      const caminho = `${user.id}/${conversaId}/${crypto.randomUUID()}-${nomeSeguroParaStorage(arquivo.name)}`;
      const { error: erroUpload } = await supabase.storage
        .from(SOBRAL_BUCKET_ANEXOS)
        .upload(caminho, arquivo, { contentType: tipoMime, upsert: false });
      if (erroUpload) throw erroUpload;
      caminhosEnviados.push(caminho);
      linhas.push({
        mensagem_id: mensagemCriada.id,
        dono: user.id,
        nome: arquivo.name.slice(0, 240),
        tipo_mime: tipoMime,
        tamanho_bytes: arquivo.size,
        categoria,
        caminho_storage: caminho,
      });
    }

    const { error: erroMetadados } = await supabase.from('consultor_anexos').insert(linhas);
    if (erroMetadados) throw erroMetadados;
  } catch (causa) {
    if (caminhosEnviados.length > 0) {
      await supabase.storage.from(SOBRAL_BUCKET_ANEXOS).remove(caminhosEnviados);
    }
    await supabase.from('consultor_mensagens').delete().eq('id', mensagemCriada.id);
    if (nova) await supabase.from('consultor_threads').delete().eq('id', conversaId);
    console.error('[sobral:anexos] falha ao enviar:', causa);
    return {
      threadId: null,
      mensagemId: null,
      falha: 'Não foi possível enviar os arquivos. Confira a conexão e tente novamente.',
    };
  }

  return { threadId: conversaId, mensagemId: mensagemCriada.id, falha: null };
}
