'use client';

import { useActionState, useState } from 'react';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { concluirIntroducao, ESTADO_INICIAL_INTRODUCAO } from './actions';
import styles from './pagina.module.css';

export function BotaoEntrar({ videoDisponivel }: { videoDisponivel: boolean }) {
  const [confirmou, setConfirmou] = useState(!videoDisponivel);
  const [estado, acao, pendente] = useActionState(concluirIntroducao, ESTADO_INICIAL_INTRODUCAO);

  return (
    <form action={acao} className={styles.formularioEntrada}>
      {videoDisponivel && (
        <label className={styles.confirmacaoVideo}>
          <input
            type="checkbox"
            checked={confirmou}
            onChange={(evento) => setConfirmou(evento.target.checked)}
          />
          <span>Assisti ao vídeo e entendi o caminho.</span>
        </label>
      )}
      <button type="submit" className={styles.botaoEntrar} disabled={pendente || !confirmou}>
        {pendente ? (
          <>
            <LoaderCircle size={17} className={styles.girando} aria-hidden="true" />
            Preparando sua plataforma
          </>
        ) : (
          <>
            {videoDisponivel ? 'Concluir e entrar' : 'Entrar na plataforma'}
            <ArrowRight size={17} strokeWidth={2} aria-hidden="true" />
          </>
        )}
      </button>
      {estado.erro && (
        <p className={styles.erro} role="alert">
          {estado.erro}
        </p>
      )}
    </form>
  );
}
