import { Check, X } from 'lucide-react';
import { categoriaDoAnexo, tamanhoLegivel } from '@/lib/consultor/anexos-contrato';
import type { ProgressoEnvio } from '@/lib/consultor/envio-anexos';
import { AnexoIcone } from './AnexoIcone';
import { AudioMensagem } from './AudioMensagem';
import styles from './AnexosDaRodada.module.css';

export function AnexosDaRodada({
  arquivos,
  progresso,
  estado,
  aoRemover,
}: {
  arquivos: readonly File[];
  progresso?: ProgressoEnvio | null;
  estado: 'rascunho' | 'enviando' | 'pausado' | 'enviado';
  aoRemover?: (indice: number) => void;
}) {
  return (
    <div
      className={styles.lista}
      aria-label={estado === 'rascunho' ? 'Arquivos prontos para enviar' : 'Arquivos da mensagem'}
    >
      {arquivos.map((arquivo, i) => {
        const audio = categoriaDoAnexo(arquivo.type) === 'audio';
        const item = progresso?.arquivos[i];
        const rotulo =
          estado === 'rascunho'
            ? 'Pronto para enviar'
            : estado === 'enviado'
              ? 'Enviado'
              : item?.concluido
                ? 'Upload concluído'
                : estado === 'pausado'
                  ? 'Envio pausado'
                  : 'Enviando';
        return (
          <div
            key={`${arquivo.name}-${arquivo.size}-${arquivo.lastModified}`}
            className={styles.anexo}
          >
            {audio ? (
              <AudioMensagem
                arquivo={arquivo}
                estado={rotulo}
                aoRemover={aoRemover ? () => aoRemover(i) : undefined}
              />
            ) : (
              <div className={styles.arquivo}>
                <AnexoIcone categoria={categoriaDoAnexo(arquivo.type)} />
                <div className={styles.dados}>
                  <strong>{arquivo.name}</strong>
                  <span>
                    {tamanhoLegivel(arquivo.size)} · {rotulo}
                  </span>
                </div>
                {estado === 'enviado' ? <Check size={18} aria-label="Enviado" /> : null}
                {aoRemover ? (
                  <button
                    type="button"
                    onClick={() => aoRemover(i)}
                    aria-label={`Remover ${arquivo.name}`}
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            )}
            {estado === 'enviando' || estado === 'pausado' ? (
              <div className={styles.andamento}>
                <progress
                  max={100}
                  value={item?.percentual ?? 0}
                  aria-label={`Envio de ${audio ? 'mensagem de áudio' : arquivo.name}`}
                />
                <span>{item?.percentual ?? 0}%</span>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
