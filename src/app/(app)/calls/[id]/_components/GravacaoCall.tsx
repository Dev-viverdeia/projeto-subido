import { ExternalLink, FileAudio, LockKeyhole } from 'lucide-react';
import type { PosCall } from '@/lib/calls/queries';
import styles from '../pagina.module.css';

function duracao(segundos: number | null) {
  if (!segundos) return 'duração em processamento';
  const minutos = Math.floor(segundos / 60);
  const restante = segundos % 60;
  return `${minutos}:${String(restante).padStart(2, '0')}`;
}

function tamanho(bytes: number | null) {
  if (!bytes) return null;
  return `${(bytes / 1024 / 1024).toFixed(bytes > 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

export function GravacaoCall({ gravacao }: { gravacao: NonNullable<PosCall['gravacao']> }) {
  const pronta = gravacao.status === 'concluida' && Boolean(gravacao.urlTemporaria);
  const detalhe = tamanho(gravacao.tamanhoBytes);

  return (
    <section className={styles.gravacaoCall} aria-labelledby="gravacao-call-titulo">
      <div className={styles.gravacaoIcone}>
        <FileAudio size={21} strokeWidth={1.7} aria-hidden="true" />
      </div>
      <div className={styles.gravacaoConteudo}>
        <p>Fonte original</p>
        <h2 id="gravacao-call-titulo">Gravação privada da reunião</h2>
        {pronta ? (
          <audio controls preload="metadata" src={gravacao.urlTemporaria ?? undefined}>
            Seu navegador não conseguiu reproduzir o áudio desta reunião.
          </audio>
        ) : (
          <span className={styles.gravacaoEstado} data-status={gravacao.status}>
            {gravacao.status === 'falhou'
              ? 'A transcrição foi preservada, mas o arquivo de áudio ficou indisponível.'
              : 'O áudio está sendo protegido e ficará disponível aqui em instantes.'}
          </span>
        )}
        <div className={styles.gravacaoMeta}>
          <span>
            <LockKeyhole size={13} aria-hidden="true" /> Somente sua conta
          </span>
          {pronta && <span>{duracao(gravacao.duracaoSegundos)}</span>}
          {detalhe && <span>{detalhe}</span>}
        </div>
      </div>
      {pronta && (
        <a
          className={styles.gravacaoAbrir}
          href={gravacao.urlTemporaria ?? undefined}
          target="_blank"
          rel="noreferrer"
        >
          Abrir áudio <ExternalLink size={14} aria-hidden="true" />
        </a>
      )}
    </section>
  );
}
