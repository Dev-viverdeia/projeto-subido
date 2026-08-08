import { ChevronRight, FileAudio } from 'lucide-react';
import type { PosCall } from '@/lib/calls/queries';
import styles from '../pagina.module.css';

function minuto(segundo: number): string {
  const minutos = Math.floor(segundo / 60);
  const segundos = segundo % 60;
  return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}

export function TranscricaoCall({
  transcricao,
}: {
  transcricao: NonNullable<PosCall['transcricao']>;
}) {
  return (
    <details className={styles.transcricao}>
      <summary>
        <span>
          <FileAudio size={18} strokeWidth={1.7} aria-hidden="true" />
          <span>
            <strong>Transcrição da reunião</strong>
            <small>{transcricao.segmentos.length} trechos · conteúdo privado</small>
          </span>
        </span>
        <ChevronRight size={18} aria-hidden="true" />
      </summary>
      <div className={styles.transcricaoCorpo}>
        {transcricao.segmentos.length ? (
          <ol>
            {transcricao.segmentos.map((segmento) => (
              <li key={segmento.itemId}>
                <time>{minuto(segmento.segundoReuniao)}</time>
                <p>{segmento.texto}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p>{transcricao.textoCompleto || 'A transcrição não possui trechos legíveis.'}</p>
        )}
      </div>
    </details>
  );
}
