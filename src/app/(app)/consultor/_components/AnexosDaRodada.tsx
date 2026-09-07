import { categoriaDoAnexo } from '@/lib/consultor/anexos-contrato';
import type { ProgressoEnvio } from '@/lib/consultor/envio-anexos';
import { ArquivoMensagem } from './ArquivoMensagem';
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
              : progresso?.confirmando
                ? 'Confirmando envio'
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
              <ArquivoMensagem
                arquivo={arquivo}
                nome={arquivo.name}
                tamanho={arquivo.size}
                categoria={categoriaDoAnexo(arquivo.type) === 'imagem' ? 'imagem' : 'documento'}
                estado={rotulo}
                aoRemover={aoRemover ? () => aoRemover(i) : undefined}
              />
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
