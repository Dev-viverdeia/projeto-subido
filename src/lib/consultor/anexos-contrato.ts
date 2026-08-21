export const SOBRAL_BUCKET_ANEXOS = 'sobral-anexos';
export const SOBRAL_MAX_ANEXOS = 4;
export const SOBRAL_MAX_BYTES_POR_ANEXO = 15 * 1024 * 1024;
export const SOBRAL_MAX_BYTES_TOTAL = 30 * 1024 * 1024;

export type CategoriaAnexoSobral = 'imagem' | 'documento' | 'audio';

export type AnexoDoConsultor = {
  id: string;
  nome: string;
  tipoMime: string;
  tamanhoBytes: number;
  categoria: CategoriaAnexoSobral;
};

const IMAGENS = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const DOCUMENTOS = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);
const AUDIOS = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
  'audio/ogg',
  'audio/flac',
  /* O Chrome pode rotular uma gravação do MediaRecorder como vídeo mesmo
     quando o blob só contém a trilha de áudio. */
  'video/webm',
]);

export const SOBRAL_ACCEPT_ANEXOS = [...IMAGENS, ...DOCUMENTOS, ...AUDIOS].join(',');

export function mimeBaseDoAnexo(tipoMime: string): string {
  return tipoMime.toLowerCase().split(';')[0]?.trim() ?? '';
}

export function categoriaDoAnexo(tipoMime: string): CategoriaAnexoSobral | null {
  const normalizado = mimeBaseDoAnexo(tipoMime);
  if (IMAGENS.has(normalizado)) return 'imagem';
  if (DOCUMENTOS.has(normalizado)) return 'documento';
  if (AUDIOS.has(normalizado)) return 'audio';
  return null;
}

export function validarAnexosSobral(arquivos: readonly File[]): string | null {
  if (arquivos.length > SOBRAL_MAX_ANEXOS) {
    return `Envie no máximo ${SOBRAL_MAX_ANEXOS} arquivos por mensagem.`;
  }

  const total = arquivos.reduce((soma, arquivo) => soma + arquivo.size, 0);
  if (total > SOBRAL_MAX_BYTES_TOTAL) {
    return 'Os arquivos desta mensagem ultrapassam 30 MB no total.';
  }

  for (const arquivo of arquivos) {
    if (arquivo.size <= 0) return `O arquivo “${arquivo.name}” está vazio.`;
    if (arquivo.size > SOBRAL_MAX_BYTES_POR_ANEXO) {
      return `O arquivo “${arquivo.name}” ultrapassa 15 MB.`;
    }
    if (!categoriaDoAnexo(arquivo.type)) {
      return `O formato de “${arquivo.name}” não é aceito. Envie imagem, áudio, PDF, texto ou arquivo do Office.`;
    }
  }

  return null;
}

export function tamanhoLegivel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

export function nomeSeguroParaStorage(nome: string): string {
  const partes = nome
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .split('.');
  const extensao = partes.length > 1 ? `.${partes.pop()!.toLowerCase().slice(0, 10)}` : '';
  const base =
    partes
      .join('.')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'arquivo';
  return `${base}${extensao}`;
}
