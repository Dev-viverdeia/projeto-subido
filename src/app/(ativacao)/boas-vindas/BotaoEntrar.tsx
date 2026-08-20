'use client';

import { useActionState, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button, Checkbox } from '@/design-system/via';
import { concluirIntroducao } from './actions';
import { ESTADO_INICIAL_INTRODUCAO } from './estado';
import styles from './pagina.module.css';

export function BotaoEntrar({ videoDisponivel }: { videoDisponivel: boolean }) {
  const [confirmou, setConfirmou] = useState(!videoDisponivel);
  const [estado, acao, pendente] = useActionState(concluirIntroducao, ESTADO_INICIAL_INTRODUCAO);

  return (
    <form action={acao} className={styles.formularioEntrada}>
      {videoDisponivel && (
        <Checkbox
          className={styles.confirmacaoVideo}
          checked={confirmou}
          onChange={(evento) => setConfirmou(evento.target.checked)}
          label="Assisti ao vídeo e entendi o caminho."
        />
      )}
      <Button
        type="submit"
        variant="accent"
        size="lg"
        fullWidth
        className={styles.botaoEntrar}
        loading={pendente}
        disabled={!confirmou}
        iconRight={!pendente ? <ArrowRight size={17} strokeWidth={2} aria-hidden="true" /> : null}
      >
        {pendente
          ? 'Abrindo sua plataforma'
          : videoDisponivel
            ? 'Concluir e entrar'
            : 'Entrar na plataforma'}
      </Button>
      {estado.erro && (
        <p className={styles.erro} role="alert">
          {estado.erro}
        </p>
      )}
    </form>
  );
}
