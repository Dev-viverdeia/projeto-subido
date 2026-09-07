'use client';

import { Upload } from 'tus-js-client';
import { env } from '@/lib/env';
import { createClient } from '@/lib/supabase/client';
import {
  categoriaDoAnexo,
  mimeBaseDoAnexo,
  nomeSeguroParaStorage,
  SOBRAL_BUCKET_ANEXOS,
  validarAnexosSobral,
} from './anexos-contrato';

export type ProgressoAnexo = { percentual: number; concluido: boolean };
export type ProgressoEnvio = { arquivos: ProgressoAnexo[]; confirmando: boolean };

/** Uma tentativa vive nesta conversa aberta. Arquivos, URLs TUS e recibos não
 * entram no localStorage. A mesma instância retoma o offset confirmado pelo servidor. */
export class EnvioAnexos {
  readonly threadId: string;
  private readonly mensagemId = crypto.randomUUID();
  private readonly ids: string[];
  private dono?: string;
  private uploads: Array<Upload | undefined> = [];
  private progresso: ProgressoAnexo[];
  private confirmando = false;
  private executando = false;
  private cancelado = false;
  private interromper?: () => void;

  constructor(
    readonly mensagem: string,
    readonly arquivos: readonly File[],
    threadId: string | undefined,
    private readonly aoProgredir: (estado: ProgressoEnvio) => void,
  ) {
    this.threadId = threadId ?? crypto.randomUUID();
    this.ids = arquivos.map(() => crypto.randomUUID());
    this.progresso = arquivos.map(() => ({ percentual: 0, concluido: false }));
  }

  private publicar() {
    this.aoProgredir({
      arquivos: this.progresso.map((p) => ({ ...p })),
      confirmando: this.confirmando,
    });
  }

  private caminho(i: number) {
    return `${this.dono}/${this.threadId}/${this.ids[i]}-${nomeSeguroParaStorage(this.arquivos[i]!.name)}`;
  }

  async executar() {
    if (this.executando) return { threadId: null, falha: 'O envio já está em andamento.' };
    this.executando = true;
    try {
      const invalido = validarAnexosSobral(this.arquivos);
      if (invalido) throw new Error(invalido);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session || (this.dono && this.dono !== session.user.id)) {
        throw new Error('Entre novamente na mesma conta para retomar o envio.');
      }
      this.dono = session.user.id;
      if (this.cancelado) throw new Error('Envio cancelado.');
      this.publicar();
      for (let i = 0; i < this.arquivos.length; i++) {
        if (this.cancelado) throw new Error('Envio cancelado.');
        if (this.progresso[i]!.concluido) continue;
        // Se o último ACK se perdeu, o objeto completo pode já estar no Storage.
        if (this.uploads[i]) {
          const { data } = await supabase.storage.from(SOBRAL_BUCKET_ANEXOS).info(this.caminho(i));
          if (
            data?.metadata?.size === this.arquivos[i]!.size &&
            data.metadata.mimetype === mimeBaseDoAnexo(this.arquivos[i]!.type)
          ) {
            this.progresso[i] = { percentual: 100, concluido: true };
            this.publicar();
            continue;
          }
        }
        await this.enviarArquivo(i, session.access_token);
      }
      if (this.cancelado) throw new Error('Envio cancelado.');
      this.confirmando = true;
      this.publicar();
      const titulo = (this.mensagem.trim() || `Análise de ${this.arquivos[0]!.name}`)
        .replace(/\s+/g, ' ')
        .slice(0, 80);
      const conteudo =
        this.mensagem.trim() ||
        (this.arquivos.every((a) => categoriaDoAnexo(a.type) === 'audio')
          ? 'Áudio enviado.'
          : `Analise estes ${this.arquivos.length} arquivos e me ajude com o que encontrar.`);
      const { data: recibo, error } = await supabase.rpc('sobral_confirmar_anexos', {
        p_thread: this.threadId,
        p_mensagem: this.mensagemId,
        p_titulo: titulo,
        p_conteudo: conteudo,
        p_anexos: this.arquivos.map((a, i) => ({
          id: this.ids[i]!,
          nome: a.name.slice(0, 240),
          tipo_mime: mimeBaseDoAnexo(a.type),
          tamanho_bytes: a.size,
          categoria: categoriaDoAnexo(a.type),
          caminho_storage: this.caminho(i),
        })),
      });
      if (error || recibo !== this.mensagemId)
        throw new Error('Falta confirmar o envio. Tente novamente sem reenviar os arquivos.');
      return { threadId: this.threadId, mensagemId: this.mensagemId, falha: null };
    } catch (erro) {
      return {
        threadId: null,
        falha:
          erro instanceof Error
            ? erro.message
            : 'O envio foi interrompido. Retome quando a conexão voltar.',
      };
    } finally {
      this.executando = false;
    }
  }

  private enviarArquivo(i: number, token: string) {
    return new Promise<void>((resolve, reject) => {
      const concluir = (erro?: Error) => {
        window.removeEventListener('offline', interromper);
        this.interromper = undefined;
        if (erro) reject(erro);
        else resolve();
      };
      const interromper = () => {
        void this.uploads[i]?.abort(false);
        concluir(new Error('Envio interrompido. Seus arquivos continuam aqui para retomar.'));
      };
      this.interromper = interromper;
      window.addEventListener('offline', interromper, { once: true });
      const options = {
        headers: { authorization: `Bearer ${token}`, 'x-upsert': 'false' },
        onProgress: (bytes: number, total: number) => {
          this.progresso[i] = {
            percentual: Math.min(99, Math.floor((bytes / total) * 100)),
            concluido: false,
          };
          this.publicar();
        },
        onError: () =>
          concluir(new Error('Envio interrompido. Seus arquivos continuam aqui para retomar.')),
        onSuccess: () => {
          this.progresso[i] = { percentual: 100, concluido: true };
          this.publicar();
          concluir();
        },
      };
      if (this.uploads[i]) Object.assign(this.uploads[i].options, options);
      else {
        const ref = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
        this.uploads[i] = new Upload(this.arquivos[i]!, {
          endpoint: `https://${ref}.storage.supabase.co/storage/v1/upload/resumable`,
          chunkSize: 6 * 1024 * 1024,
          retryDelays: null,
          uploadDataDuringCreation: true,
          storeFingerprintForResuming: false,
          metadata: {
            bucketName: SOBRAL_BUCKET_ANEXOS,
            objectName: this.caminho(i),
            contentType: mimeBaseDoAnexo(this.arquivos[i]!.type),
          },
          onBeforeRequest: (req) => {
            (req.getUnderlyingObject() as XMLHttpRequest).timeout = 90_000;
          },
          ...options,
        });
      }
      this.uploads[i].start();
    });
  }

  cancelar(): Promise<boolean> {
    // Após tentar o commit, uma resposta perdida NÃO autoriza apagar o anexo.
    if (this.confirmando) return Promise.resolve(false);
    this.cancelado = true;
    this.interromper?.();
    // Voltar à edição não depende da rede. A limpeza só toca os caminhos desta
    // tentativa, nunca arquivos de uma mensagem cujo commit possa ter ocorrido.
    void Promise.allSettled(this.uploads.flatMap((u) => (u ? [u.abort(true)] : [])))
      .then(async () => {
        if (this.dono)
          await createClient()
            .storage.from(SOBRAL_BUCKET_ANEXOS)
            .remove(this.arquivos.map((_, i) => this.caminho(i)));
      })
      .catch(() => undefined);
    return Promise.resolve(true);
  }
}
