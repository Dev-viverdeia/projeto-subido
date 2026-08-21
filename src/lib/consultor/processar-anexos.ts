import 'server-only';

import OpenAI, { toFile } from 'openai';
import type { SupabaseClient } from '@supabase/supabase-js';
import { openAIEnv } from '@/lib/env';
import type { Database } from '@/lib/supabase/types.generated';
import { SOBRAL_BUCKET_ANEXOS, type CategoriaAnexoSobral } from './anexos-contrato';
import { ErroSobral } from './erro';

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
 * Baixa arquivos privados como service role, transcreve áudio e cria arquivos
 * temporários na OpenAI para imagem/documento. Eles expiram em uma hora e são
 * apagados logo após a resposta; o original continua somente no Storage privado.
 */
export async function prepararAnexosParaModelo(
  admin: SupabaseClient<Database>,
  anexos: readonly AnexoPersistidoSobral[],
): Promise<AnexosPreparados> {
  if (anexos.length === 0) {
    return { entradas: [], transcricoes: [], limpar: () => Promise.resolve() };
  }

  const { OPENAI_API_KEY } = openAIEnv();
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY, maxRetries: 2, timeout: 90_000 });
  const idsTemporarios: string[] = [];
  const entradas: EntradaAnexoModelo[] = [];
  const transcricoes: Array<{ id: string; texto: string }> = [];

  try {
    for (const anexo of anexos) {
      const { data, error } = await admin.storage
        .from(SOBRAL_BUCKET_ANEXOS)
        .download(anexo.caminhoStorage);
      if (error || !data) throw error ?? new Error('arquivo-indisponivel');

      const arquivo = await toFile(await data.arrayBuffer(), anexo.nome, { type: anexo.tipoMime });

      if (anexo.categoria === 'audio') {
        const texto =
          anexo.transcricao?.trim() ||
          (
            await openai.audio.transcriptions.create({
              file: arquivo,
              model: 'gpt-transcribe',
              language: 'pt',
              response_format: 'json',
            })
          ).text.trim();

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

      const temporario = await openai.files.create({
        file: arquivo,
        purpose: 'user_data',
        expires_after: { anchor: 'created_at', seconds: 3600 },
      });
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
      'Não consegui ler um dos arquivos. Confira o formato e tente enviá-lo novamente.',
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
