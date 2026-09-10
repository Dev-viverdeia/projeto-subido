import { useEffect, type RefObject } from 'react';
import styles from './Conversa.module.css';

export function CampoMensagem({
  campoRef,
  texto,
  ocupado,
  alterar,
  enviar,
}: {
  campoRef: RefObject<HTMLTextAreaElement | null>;
  texto: string;
  ocupado: boolean;
  alterar: (texto: string) => void;
  enviar: () => void;
}) {
  useEffect(() => {
    const campo = campoRef.current;
    if (!campo) return;
    campo.style.height = 'auto';
    campo.style.height = `${Math.min(campo.scrollHeight, 180)}px`;
  }, [texto, campoRef]);
  return (
    <div className={styles.linhaCompositor}>
      <label className="sr-only" htmlFor="mensagem-consultor">
        Sua pergunta para o Sobral AI
      </label>
      <textarea
        id="mensagem-consultor"
        ref={campoRef}
        className={styles.campo}
        value={texto}
        onChange={(e) => alterar(e.target.value.slice(0, 8000))}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            enviar();
          }
        }}
        disabled={ocupado}
        rows={2}
        placeholder="Conte o que você precisa resolver…"
      />
    </div>
  );
}
