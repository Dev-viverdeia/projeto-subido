import { useRef } from 'react';
import { ArrowUp, Paperclip, Square } from 'lucide-react';
import { SOBRAL_ACCEPT_ANEXOS } from '@/lib/consultor/anexos-contrato';
import { ControlesGravacao } from './ControlesGravacao';
import styles from './Conversa.module.css';

export function BarraCompositor({
  ocupado,
  gravando,
  preparando,
  segundos,
  incluir,
  alternar,
  cancelar,
  podeEnviar,
  gerando,
  parando,
  parar,
}: {
  ocupado: boolean;
  gravando: boolean;
  preparando: boolean;
  segundos: number;
  incluir: (arquivos: File[]) => void;
  alternar: () => Promise<void>;
  cancelar: () => void;
  podeEnviar: boolean;
  gerando: boolean;
  parando: boolean;
  parar: () => Promise<void>;
}) {
  const arquivoRef = useRef<HTMLInputElement>(null);
  return (
    <div className={styles.barraCompositor}>
      <div className={styles.ferramentas}>
        <input
          ref={arquivoRef}
          className="sr-only"
          type="file"
          aria-label="Selecionar arquivos para a conversa"
          tabIndex={-1}
          multiple
          accept={SOBRAL_ACCEPT_ANEXOS}
          onChange={(evento) => {
            incluir(Array.from(evento.target.files ?? []));
            evento.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => arquivoRef.current?.click()}
          disabled={ocupado || gravando || preparando}
          aria-label="Anexar documento, imagem ou áudio"
          title="Anexar arquivo"
        >
          <Paperclip size={17} strokeWidth={1.9} aria-hidden="true" />
          <span>Arquivo</span>
        </button>
        <ControlesGravacao
          gravando={gravando}
          preparando={preparando}
          segundos={segundos}
          ocupado={ocupado}
          alternar={alternar}
          cancelar={cancelar}
        />
      </div>
      {gerando ? (
        <button
          type="button"
          className={styles.enviar}
          onClick={() => void parar()}
          disabled={parando}
          aria-label={parando ? 'Interrompendo resposta' : 'Parar resposta'}
          title="Parar resposta"
        >
          <Square size={14} fill="currentColor" aria-hidden="true" />
        </button>
      ) : (
        <button
          type="submit"
          className={styles.enviar}
          disabled={!podeEnviar || ocupado || gravando || preparando}
          aria-label={ocupado ? 'Aguardando o Sobral AI' : 'Enviar mensagem'}
        >
          <ArrowUp size={17} strokeWidth={2.2} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
