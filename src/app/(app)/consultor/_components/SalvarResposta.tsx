'use client';
import { useId, useState, useTransition } from 'react';
import { Bookmark, BookmarkCheck, LoaderCircle } from 'lucide-react';
import { salvarResposta } from '@/lib/consultor/salvar-resposta';
import styles from './RespostasSalvas.module.css';

export function SalvarResposta({
  mensagem,
  dono,
  salva = false,
  compacto = false,
  aoAtualizar,
}: {
  mensagem: string;
  dono: string;
  salva?: boolean;
  compacto?: boolean;
  aoAtualizar?: () => void;
}) {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState('');
  const idErro = useId();
  const Icone = pendente ? LoaderCircle : salva ? BookmarkCheck : Bookmark;
  return (
    <span className={styles.acaoSalvar}>
      <button
        type="button"
        className={`${styles.salvar} ${compacto ? styles.compacto : ''}`}
        aria-label={salva ? 'Remover das respostas salvas' : 'Salvar resposta'}
        aria-pressed={salva}
        aria-describedby={erro ? idErro : undefined}
        title={
          salva
            ? 'Remover das salvas. A conversa continua intacta.'
            : 'Guardar em Conversas → Salvas'
        }
        disabled={pendente}
        onClick={() => {
          setErro('');
          iniciar(async () => {
            try {
              const resultado = await salvarResposta({ dono, mensagem, salvar: !salva });
              if ('erro' in resultado) setErro(resultado.erro);
              else aoAtualizar?.();
            } catch {
              setErro('Não foi possível confirmar. Tente novamente.');
            }
          });
        }}
      >
        <Icone
          size={17}
          strokeWidth={1.7}
          className={pendente ? styles.girando : ''}
          aria-hidden="true"
        />
        <span>{pendente ? 'Salvando…' : salva ? 'Salva' : 'Salvar'}</span>
      </button>
      {erro && (
        <span id={idErro} role="alert" className={styles.erro}>
          {erro}
        </span>
      )}
    </span>
  );
}
