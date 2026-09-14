'use client';
import { CheckCircle2, LoaderCircle, LogOut } from 'lucide-react';
import styles from './sala.module.css';

export function EstadoSaidaReuniao({
  estado,
  anfitriao,
  reuniaoId,
  aoVoltar,
}: {
  estado: 'processando' | 'encerrada' | 'saiu';
  anfitriao: boolean;
  reuniaoId: string;
  aoVoltar: () => void;
}) {
  return (
    <main className={styles.saida}>
      <section className={styles.saidaCartao} role="status" aria-live="polite">
        <span className={styles.saidaIcone} aria-hidden="true">
          {estado === 'processando' ? (
            <LoaderCircle size={28} />
          ) : estado === 'saiu' ? (
            <LogOut size={28} />
          ) : (
            <CheckCircle2 size={28} />
          )}
        </span>
        <h1>
          {estado === 'processando'
            ? 'Encerramento solicitado'
            : estado === 'saiu'
              ? 'Você saiu da reunião'
              : 'Sua participação foi encerrada'}
        </h1>
        <span>
          {estado === 'processando'
            ? 'Abrindo a ficha para acompanhar o registro da conversa.'
            : estado === 'saiu'
              ? 'Você não encerrou a sala para os outros participantes.'
              : 'Você já pode fechar esta página.'}
        </span>
        {estado === 'saiu' && (
          <div className={styles.recuperacaoAcoes}>
            <button type="button" className={styles.botaoRetomar} onClick={aoVoltar}>
              Voltar à entrada
            </button>
            {anfitriao && (
              <a className={styles.botaoEncerrar} href={`/reunioes/${reuniaoId}`}>
                Ver ficha da reunião
              </a>
            )}
          </div>
        )}
        {estado === 'encerrada' && anfitriao && (
          <a className={styles.botaoRetomar} href={`/reunioes/${reuniaoId}`}>
            Ver ficha da reunião
          </a>
        )}
        {estado === 'processando' && <i aria-hidden="true" />}
      </section>
    </main>
  );
}
