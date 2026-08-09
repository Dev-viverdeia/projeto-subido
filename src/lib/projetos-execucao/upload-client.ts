'use client';

import { Upload } from 'tus-js-client';
import { env } from '@/lib/env';
import { createClient } from '@/lib/supabase/client';

export const LIMITE_ARQUIVO_PROJETO = 50 * 1024 * 1024;
const LIMITE_UPLOAD_PADRAO = 6 * 1024 * 1024;
const BUCKET = 'projeto-entregaveis';

const MIME_POR_EXTENSAO: Record<string, string> = {
  pdf: 'application/pdf',
  zip: 'application/zip',
  json: 'application/json',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  csv: 'text/csv',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  mp4: 'video/mp4',
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
};

function nomeSeguro(nome: string): string {
  const seguro = nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(-140);
  return seguro || 'arquivo';
}

export function tituloDoArquivo(nome: string): string {
  return nome
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
}

export function mimePermitido(arquivo: File): string | null {
  const extensao = arquivo.name.split('.').at(-1)?.toLowerCase() ?? '';
  return MIME_POR_EXTENSAO[extensao] ?? null;
}

export async function enviarArquivoAoCofre({
  arquivo,
  projetoId,
  aoProgredir,
}: {
  arquivo: File;
  projetoId: string;
  aoProgredir: (percentual: number) => void;
}): Promise<{ caminho: string; mimeType: string }> {
  if (arquivo.size > LIMITE_ARQUIVO_PROJETO) {
    throw new Error('O arquivo ultrapassa o limite de 50 MB.');
  }

  const mimeType = mimePermitido(arquivo);
  if (!mimeType) {
    throw new Error('Use PDF, documento, planilha, apresentação, imagem, áudio, vídeo ou ZIP.');
  }

  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Sua sessão expirou. Entre novamente para continuar.');

  const caminho = `${session.user.id}/${projetoId}/${crypto.randomUUID()}-${nomeSeguro(arquivo.name)}`;
  aoProgredir(2);

  if (arquivo.size <= LIMITE_UPLOAD_PADRAO) {
    const { error } = await supabase.storage.from(BUCKET).upload(caminho, arquivo, {
      cacheControl: '3600',
      contentType: mimeType,
      upsert: false,
    });
    if (error) throw new Error(error.message);
    aoProgredir(100);
    return { caminho, mimeType };
  }

  const projetoRef = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
  await new Promise<void>((resolve, reject) => {
    const upload = new Upload(arquivo, {
      endpoint: `https://${projetoRef}.storage.supabase.co/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10_000, 20_000],
      headers: {
        authorization: `Bearer ${session.access_token}`,
        'x-upsert': 'false',
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: BUCKET,
        objectName: caminho,
        contentType: mimeType,
        cacheControl: '3600',
      },
      chunkSize: LIMITE_UPLOAD_PADRAO,
      onError: (error) => reject(error),
      onProgress: (enviados, total) => aoProgredir(Math.round((enviados / total) * 100)),
      onSuccess: () => resolve(),
    });

    void upload.findPreviousUploads().then((anteriores) => {
      const anterior = anteriores[0];
      if (anterior) upload.resumeFromPreviousUpload(anterior);
      upload.start();
    });
  });

  return { caminho, mimeType };
}

export async function removerUploadOrfao(caminho: string): Promise<void> {
  await createClient().storage.from(BUCKET).remove([caminho]);
}
