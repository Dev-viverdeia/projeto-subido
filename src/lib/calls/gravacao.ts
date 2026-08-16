import 'server-only';

import { randomUUID } from 'node:crypto';
import {
  EgressClient,
  EgressStatus,
  EncodedFileOutput,
  EncodedFileType,
  S3Upload,
  WebhookConfig,
  type EgressInfo,
} from 'livekit-server-sdk';
import { callRecordingEnv, livekitEnv } from '@/lib/env';
import { handleError } from '@/lib/errors';
// A gravação é uma integração de sistema; a rota que a inicia já validou o dono.
// eslint-disable-next-line no-restricted-imports
import { createAdminClient } from '@/lib/supabase/admin';

const BUCKET = 'call-gravacoes';

export type EstadoGravacao = 'pendente' | 'gravando' | 'processando' | 'concluida' | 'falhou';

export type GravacaoOperacional = {
  id: string;
  reuniaoId: string;
  status: EstadoGravacao;
  caminhoArquivo: string | null;
  idProvedor: string | null;
};

function hostHttp(url: string) {
  return url.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:');
}

function dataDeNanos(valor: bigint) {
  if (valor <= 0n) return null;
  return new Date(Number(valor / 1_000_000n)).toISOString();
}

function segundosDeNanos(valor: bigint) {
  if (valor <= 0n) return null;
  return Math.max(1, Math.round(Number(valor / 1_000_000_000n)));
}

function estadoDoEgress(status: EgressStatus): EstadoGravacao {
  if (status === EgressStatus.EGRESS_COMPLETE) return 'concluida';
  if (status === EgressStatus.EGRESS_ENDING) return 'processando';
  if (
    status === EgressStatus.EGRESS_FAILED ||
    status === EgressStatus.EGRESS_ABORTED ||
    status === EgressStatus.EGRESS_LIMIT_REACHED
  ) {
    return 'falhou';
  }
  return 'gravando';
}

function mapearGravacao(linha: {
  id: string;
  reuniao_id: string;
  status: string;
  caminho_arquivo: string | null;
  id_provedor: string | null;
}): GravacaoOperacional {
  return {
    id: linha.id,
    reuniaoId: linha.reuniao_id,
    status: linha.status as EstadoGravacao,
    caminhoArquivo: linha.caminho_arquivo,
    idProvedor: linha.id_provedor,
  };
}

async function lerGravacaoDaReuniao(reuniaoId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('calls_gravacoes')
    .select('id, reuniao_id, status, caminho_arquivo, id_provedor')
    .eq('reuniao_id', reuniaoId)
    .maybeSingle();
  if (error) throw handleError(error, 'calls:gravacao:ler');
  return data ? mapearGravacao(data) : null;
}

/** Inicia uma única gravação de áudio por reunião, mesmo após recarregamentos. */
export async function iniciarGravacao({
  dono,
  reuniaoId,
  salaProvedor,
  origem,
}: {
  dono: string;
  reuniaoId: string;
  salaProvedor: string;
  origem: string;
}): Promise<GravacaoOperacional> {
  const existente = await lerGravacaoDaReuniao(reuniaoId);
  if (existente && existente.status !== 'falhou') return existente;

  const livekit = livekitEnv();
  const storage = callRecordingEnv();
  if (!livekit || !storage) {
    throw new Error('A gravação segura ainda não está configurada neste ambiente.');
  }

  const admin = createAdminClient();
  const gravacaoId = existente?.id ?? randomUUID();
  const caminho = `${dono}/${reuniaoId}/${gravacaoId}.mp3`;

  if (!existente) {
    const { error } = await admin.from('calls_gravacoes').insert({
      id: gravacaoId,
      dono,
      reuniao_id: reuniaoId,
      caminho_arquivo: caminho,
      status: 'pendente',
      mime_type: 'audio/mpeg',
    });
    if (error?.code === '23505') {
      const concorrente = await lerGravacaoDaReuniao(reuniaoId);
      if (concorrente) return concorrente;
    }
    if (error) throw handleError(error, 'calls:gravacao:criar');
  } else {
    const { error } = await admin
      .from('calls_gravacoes')
      .update({
        status: 'pendente',
        caminho_arquivo: caminho,
        id_provedor: null,
        erro: null,
        iniciada_em: null,
        encerrada_em: null,
        duracao_segundos: null,
        tamanho_bytes: null,
      })
      .eq('id', gravacaoId)
      .eq('dono', dono);
    if (error) throw handleError(error, 'calls:gravacao:retomar');
  }

  try {
    const cliente = new EgressClient(
      hostHttp(livekit.LIVEKIT_URL),
      livekit.LIVEKIT_API_KEY,
      livekit.LIVEKIT_API_SECRET,
    );
    const s3 = new S3Upload({
      accessKey: storage.SUPABASE_S3_ACCESS_KEY_ID,
      secret: storage.SUPABASE_S3_SECRET_ACCESS_KEY,
      sessionToken: storage.SUPABASE_S3_SESSION_TOKEN,
      region: storage.SUPABASE_S3_REGION,
      endpoint: storage.SUPABASE_S3_ENDPOINT,
      bucket: BUCKET,
      forcePathStyle: true,
      contentDisposition: 'inline',
      metadata: {
        reuniao: reuniaoId,
        dono,
      },
    });
    const arquivo = new EncodedFileOutput({
      fileType: EncodedFileType.MP3,
      filepath: caminho,
      disableManifest: true,
      output: { case: 's3', value: s3 },
    });
    const webhook = new WebhookConfig({
      url: `${origem.replace(/\/$/, '')}/api/livekit/webhook`,
      signingKey: livekit.LIVEKIT_API_KEY,
    });
    const egress = await cliente.startRoomCompositeEgress(salaProvedor, arquivo, {
      audioOnly: true,
      webhooks: [webhook],
    });

    const { data, error } = await admin
      .from('calls_gravacoes')
      .update({
        id_provedor: egress.egressId,
        status: 'gravando',
        iniciada_em: dataDeNanos(egress.startedAt) ?? new Date().toISOString(),
        erro: null,
      })
      .eq('id', gravacaoId)
      .eq('dono', dono)
      .select('id, reuniao_id, status, caminho_arquivo, id_provedor')
      .single();
    if (error) throw handleError(error, 'calls:gravacao:ativar');
    return mapearGravacao(data);
  } catch (causa) {
    const mensagem = causa instanceof Error ? causa.message : 'Falha ao iniciar a gravação.';
    await admin
      .from('calls_gravacoes')
      .update({ status: 'falhou', erro: mensagem.slice(0, 500) })
      .eq('id', gravacaoId)
      .eq('dono', dono);
    throw causa;
  }
}

/** Consolida o estado do arquivo a partir de um evento assinado do LiveKit. */
export async function sincronizarGravacaoDoEgress(egress: EgressInfo) {
  if (!egress.egressId) return null;
  const admin = createAdminClient();
  const arquivo = egress.fileResults[0];
  const estado = estadoDoEgress(egress.status);
  const erroEgress = egress.error || egress.details || null;
  const { data, error } = await admin
    .from('calls_gravacoes')
    .update({
      status: estado,
      ...(arquivo?.filename ? { caminho_arquivo: arquivo.filename } : {}),
      ...(arquivo?.duration ? { duracao_segundos: segundosDeNanos(arquivo.duration) } : {}),
      ...(arquivo?.size ? { tamanho_bytes: Number(arquivo.size) } : {}),
      ...(egress.startedAt ? { iniciada_em: dataDeNanos(egress.startedAt) } : {}),
      ...(egress.endedAt ? { encerrada_em: dataDeNanos(egress.endedAt) } : {}),
      erro: estado === 'falhou' ? (erroEgress ?? 'A gravação foi interrompida.') : null,
    })
    .eq('id_provedor', egress.egressId)
    .select('id, dono, reuniao_id, status, caminho_arquivo, id_provedor')
    .maybeSingle();
  if (error) throw handleError(error, 'calls:gravacao:webhook');
  return data
    ? {
        ...mapearGravacao(data),
        dono: data.dono,
      }
    : null;
}
