'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { LoaderCircle, LogOut, PhoneOff } from 'lucide-react';
import { Button } from '@/design-system/via';
import { ModalOperacao } from '@/app/(app)/_components/ModalOperacao';
import styles from './SaidaReuniao.module.css';

/** A escolha explícita confirma a consequência. Abrir ou fechar não altera a sala. */
export function SaidaReuniao({
  aoSair,
  aoEncerrar,
  className,
}: {
  aoSair: () => Promise<void>;
  aoEncerrar: () => Promise<void>;
  className?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [acao, setAcao] = useState<'sair' | 'encerrar' | null>(null);
  const [erro, setErro] = useState('');
  const ocupado = useRef(false);
  const id = useId();
  const estado = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (acao || erro) estado.current?.focus();
  }, [acao, erro]);

  async function executar(escolha: 'sair' | 'encerrar') {
    if (ocupado.current) return;
    ocupado.current = true;
    setAcao(escolha);
    setErro('');
    try {
      await (escolha === 'sair' ? aoSair() : aoEncerrar());
      setAberto(false);
    } catch {
      setErro(
        escolha === 'sair'
          ? 'Não foi possível concluir a saída. Tente novamente.'
          : 'Não foi possível concluir o encerramento. Tente novamente.',
      );
    } finally {
      ocupado.current = false;
      setAcao(null);
    }
  }

  return (
    <>
      <button
        type="button"
        className={className}
        aria-label="Sair da reunião"
        aria-haspopup="dialog"
        aria-expanded={aberto}
        onClick={(evento) => {
          // Safari não foca botões ao tocar. O modal precisa saber para onde devolver o foco.
          evento.currentTarget.focus();
          setErro('');
          setAberto(true);
        }}
      >
        <PhoneOff size={20} aria-hidden="true" />
        <span>Sair</span>
      </button>
      <ModalOperacao
        open={aberto}
        onClose={() => setAberto(false)}
        title="Sair da reunião"
        size="sm"
        blocked={acao !== null}
        footer={
          <Button
            variant="secondary"
            data-autofocus
            disabled={acao !== null}
            onClick={() => setAberto(false)}
          >
            Voltar à reunião
          </Button>
        }
      >
        <div className={styles.opcoes} aria-busy={acao !== null}>
          <button
            type="button"
            className={styles.opcao}
            aria-label="Sair da sala"
            aria-describedby={`${id}-sair`}
            disabled={acao !== null}
            onClick={() => void executar('sair')}
          >
            {acao === 'sair' ? (
              <LoaderCircle size={22} aria-hidden="true" />
            ) : (
              <LogOut size={22} aria-hidden="true" />
            )}
            <span>
              <strong>{acao === 'sair' ? 'Saindo da sala…' : 'Sair da sala'}</strong>
              <span id={`${id}-sair`}>Os outros participantes podem continuar.</span>
            </span>
          </button>
          <button
            type="button"
            className={`${styles.opcao} ${styles.encerrar}`}
            aria-label="Encerrar para todos"
            aria-describedby={`${id}-encerrar`}
            disabled={acao !== null}
            onClick={() => void executar('encerrar')}
          >
            {acao === 'encerrar' ? (
              <LoaderCircle size={22} aria-hidden="true" />
            ) : (
              <PhoneOff size={22} aria-hidden="true" />
            )}
            <span>
              <strong>
                {acao === 'encerrar' ? 'Encerrando para todos…' : 'Encerrar para todos'}
              </strong>
              <span id={`${id}-encerrar`}>Fecha a sala para todos. O registro fica na ficha.</span>
            </span>
          </button>
          {acao && (
            <p ref={estado} tabIndex={-1} role="status" className={styles.estado}>
              Aguarde a confirmação para sair.
            </p>
          )}
          {erro && (
            <p ref={estado} tabIndex={-1} role="alert" className={styles.erro}>
              {erro}
            </p>
          )}
        </div>
      </ModalOperacao>
    </>
  );
}
