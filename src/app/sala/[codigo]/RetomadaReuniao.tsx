'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { FileText, LoaderCircle, RotateCcw, WifiOff } from 'lucide-react';
import styles from './RetomadaReuniao.module.css';

export function RetomadaReuniao({
  titulo,
  offline,
  falhou,
  rascunho,
  aoTentar,
  children,
}: {
  titulo: string;
  offline: boolean;
  falhou: boolean;
  rascunho: boolean;
  aoTentar: () => void;
  children: ReactNode;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);
  const tentando = !offline && !falhou;
  return (
    <main className={styles.pagina}>
      <section className={styles.cartao} aria-labelledby="titulo-retomada">
        <p className={styles.reuniao}>{titulo}</p>
        <div className={styles.icone} aria-hidden="true">
          {tentando ? <LoaderCircle size={26} className={styles.girando} /> : <WifiOff size={26} />}
        </div>
        <div role="status" aria-live="polite" aria-atomic="true">
          <h1 id="titulo-retomada" tabIndex={-1} ref={heading}>
            {offline
              ? 'Você está sem internet'
              : falhou
                ? 'Não foi possível reconectar'
                : 'Reconectando à reunião'}
          </h1>
          <p className={styles.orientacao}>
            {offline
              ? falhou
                ? 'Conecte-se à internet para tentar novamente.'
                : 'Vamos tentar novamente quando sua conexão voltar.'
              : falhou
                ? 'Confira sua conexão e tente entrar novamente.'
                : 'Aguarde um instante. Estamos tentando conectar você novamente.'}
          </p>
        </div>
        {rascunho && (
          <p className={styles.rascunho}>
            <FileText size={18} aria-hidden="true" />
            Rascunho mantido nesta aba
          </p>
        )}
        <div className={styles.acoes}>
          {!offline && falhou && (
            <button type="button" className={styles.tentar} onClick={aoTentar}>
              <RotateCcw size={18} aria-hidden="true" />
              Tentar novamente
            </button>
          )}
          {children}
        </div>
      </section>
    </main>
  );
}
