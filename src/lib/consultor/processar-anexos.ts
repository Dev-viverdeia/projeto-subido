import 'server-only';

import OpenAI, { toFile } from 'openai';
import type { SupabaseClient } from '@supabase/supabase-js';
import { openAIEnv } from '@/lib/env';
import type { Database } from '@/lib/supabase/types.generated';
import { SOBRAL_BUCKET_ANEXOS, type CategoriaAnexoSobral } from './anexos-contrato';
import { ErroSobral } from './erro';
import { comOrcamentoSobral } from './orcamento';

export type AnexoPersistidoSobral = {
  id: string;
  nome: string;
  tipoMime: string;
  categoria: CategoriaAnexoSobral;
  caminhoStorage: string;
  transcricao: string | null;
};

export type EntradaAnexoModelo = {
  id: string;
  nome: string;
  categoria: CategoriaAnexoSobral;
  fileId?: string;
  transcricao?: string;
};

export type AnexosPreparados = {
  entradas: EntradaAnexoModelo[];
  transcricoes: Array<{ id: string; texto: string }>;
  limpar: () => Promise<void>;
};

/**
 * Baixa arquivos privados com a sessão do usuário, transcreve áudio e cria arquivos
 * temporários na OpenAI para imagem/documento. Eles expiram em uma hora e são
 * apagados logo após a resposta; o original continua somente no Storage privado.
 */
export async function prepararAnexosParaModelo(
  supabase: SupabaseClient<Database>,
  anexos: readonly AnexoPersistidoSobral[],
  contexto: { dono: string; threadId: string },
  signal?: AbortSignal,
): Promise<AnexosPreparados> {
  if (anexos.length === 0) {
    return { entradas: [], transcricoes: [], limpar: () => Promise.resolve() };
  }

  // Valida também registros antigos e áudios com transcrição em cache. Não
  // normalize URLs: fragmentos, escapes e segmentos extras devem falhar.
  for (const anexo of anexos) {
    const partes = anexo.caminhoStorage.split('/');
    if (
      partes.length !== 3 ||
      partes[0] !== contexto.dono ||
      partes[1] !== contexto.threadId ||
      !partes[2]?.startsWith(`${anexo.id}-`) ||
      /[^a-zA-Z0-9._-]/.test(partes[2])
    ) {
      throw new ErroSobral(
        'Não foi possível acessar este anexo. Envie o arquivo novamente.',
        'falha',
      );
    }
  }

  const { OPENAI_API_KEY } = openAIEnv();
  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
    maxRetries: 0,
    timeout: 90_000,
  });
  const idsTemporarios: string[] = [];
  const entradas: EntradaAnexoModelo[] = [];
  const transcricoes: Array<{ id: string; texto: string }> = [];

  try {
    for (const anexo of anexos) {
      signal?.throwIfAborted();
      if (anexo.categoria === 'audio' && anexo.transcricao?.trim()) {
        entradas.push({
          id: anexo.id,
          nome: anexo.nome,
          categoria: 'audio',
          transcricao: anexo.transcricao,
        });
        continue;
      }
      const { data, error } = await supabase.storage
        .from(SOBRAL_BUCKET_ANEXOS)
        .download(anexo.caminhoStorage);
      if (error || !data) throw error ?? new Error('arquivo-indisponivel');

      const arquivo = await toFile(await data.arrayBuffer(), anexo.nome, { type: anexo.tipoMime });

      if (anexo.categoria === 'audio') {
        // Áudio também é trabalho pago. Reserva antes de chamar o provedor,
        // inclusive quando o usuário cancela. Não debita a carteira de créditos.
        const transcricao = await comOrcamentoSobral(
          contexto.dono,
          128_000,
          async (informarUso) => {
            const resposta = await openai.audio.transcriptions.create(
              {
                file: arquivo,
                model: 'gpt-transcribe',
                language: 'pt',
                response_format: 'json',
              },
              { signal },
            );
            if (resposta.usage?.type === 'tokens') informarUso(resposta.usage.total_tokens);
            return resposta;
          },
          signal,
        );
        const texto = transcricao.text.trim();

        if (!texto) throw new Error('transcricao-vazia');
        entradas.push({
          id: anexo.id,
          nome: anexo.nome,
          categoria: 'audio',
          transcricao: texto,
        });
        if (!anexo.transcricao) transcricoes.push({ id: anexo.id, texto });
        continue;
      }

      const temporario = await openai.files.create(
        {
          file: arquivo,
          purpose: 'user_data',
          expires_after: { anchor: 'created_at', seconds: 3600 },
        },
        { signal },
      );
      idsTemporarios.push(temporario.id);
      entradas.push({
        id: anexo.id,
        nome: anexo.nome,
        categoria: anexo.categoria,
        fileId: temporario.id,
      });
    }
  } catch (causa) {
    await Promise.allSettled(idsTemporarios.map((id) => openai.files.delete(id)));
    if (signal?.aborted) throw causa;
    if (causa instanceof ErroSobral) throw causa;
    if (causa instanceof OpenAI.AuthenticationError) {
      throw new ErroSobral('A chave do Sobral AI foi recusada.', 'sem-chave');
    }
    if (causa instanceof OpenAI.RateLimitError) {
      throw new ErroSobral(
        'O processamento de arquivos está ocupado agora. Tente novamente.',
        'limite',
      );
    }
    console.error('[sobral:anexos] falha ao processar:', causa);
    throw new ErroSobral(
      'Não consegui analisar um dos arquivos. Eles continuam na conversa. Tente novamente.',
      'falha',
    );
  }

  return {
    entradas,
    transcricoes,
    limpar: async () => {
      await Promise.allSettled(idsTemporarios.map((id) => openai.files.delete(id)));
    },
  };
}
