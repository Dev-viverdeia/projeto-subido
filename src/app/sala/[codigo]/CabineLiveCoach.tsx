'use client';

import { AudioLines, Circle, Layers3, LockKeyhole, Radio } from 'lucide-react';
import styles from './LiveCoach.module.css';

export type EstadoCoach = 'conectando' | 'escutando' | 'analisando' | 'indisponivel';
export type EstadoGravacao = 'pendente' | 'gravando' | 'processando' | 'concluida' | 'falhou';
export type EstadoGravacaoUi = 'iniciando' | EstadoGravacao | 'indisponivel';

export type SugestaoLive = {
  id: string;
  categoria: string;
  titulo: string;
  sugestao: string;
  metodologia: string | null;
  trecho_gatilho: string | null;
  prioridade: number;
};

const ROTULO_ESTADO: Record<EstadoCoach, string> = {
  conectando: 'Conectando inteligência',
  escutando: 'Escutando a conversa',
  analisando: 'Lendo o momento',
  indisponivel: 'Transcrição indisponível',
};

const ROTULO_GRAVACAO: Record<EstadoGravacaoUi, string> = {
  iniciando: 'Preparando memória',
  pendente: 'Preparando memória',
  gravando: 'Gravação protegida',
  processando: 'Salvando gravação',
  concluida: 'Gravação preservada',
  falhou: 'Somente transcrição',
  indisponivel: 'Somente transcrição',
};

export function CabineLiveCoach({
  ativo,
  estado,
  sugestao,
  fala,
  parcial = false,
  falha = '',
  gravacao = 'iniciando',
}: {
  ativo: boolean;
  estado: EstadoCoach;
  sugestao: SugestaoLive | null;
  fala: string;
  parcial?: boolean;
  falha?: string;
  gravacao?: EstadoGravacaoUi;
}) {
  const intensidade =
    estado === 'analisando' ? styles.intenso : estado === 'escutando' ? styles.ativo : '';

  return (
    <aside className={styles.painel} aria-label="Live Coach privado">
      <header className={styles.cabecalho}>
        <span className={`${styles.estado} ${intensidade}`} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <div>
          <p>{ativo ? 'Live Coach' : 'Memória da reunião'}</p>
          <span>{ROTULO_ESTADO[estado]}</span>
        </div>
        <span className={styles.privado}>
          <LockKeyhole size={13} strokeWidth={1.8} aria-hidden="true" /> Só você vê
        </span>
      </header>

      <section className={styles.recomendacao} aria-live="polite" aria-atomic="true">
        <div className={styles.rotuloSecao}>
          <Layers3 size={15} strokeWidth={1.8} aria-hidden="true" />
          Uma orientação por vez
        </div>
        {sugestao ? (
          <>
            <div className={styles.metaSugestao}>
              <span>{sugestao.categoria}</span>
              {sugestao.metodologia && <span>{sugestao.metodologia}</span>}
            </div>
            <h2>{sugestao.titulo}</h2>
            <p>{sugestao.sugestao}</p>
            {sugestao.trecho_gatilho && (
              <p className={styles.evidencia}>Ouvido agora: “{sugestao.trecho_gatilho}”</p>
            )}
          </>
        ) : (
          <div className={styles.espera}>
            <h2>{ativo ? 'Escute antes de conduzir.' : 'A conversa já está virando histórico.'}</h2>
            <p>
              {ativo
                ? 'Quando houver um sinal útil, uma única recomendação aparece aqui.'
                : 'Os trechos serão salvos na ficha ao encerrar.'}
            </p>
          </div>
        )}
      </section>

      <section className={styles.transcricao}>
        <div className={styles.rotuloSecao}>
          <AudioLines size={15} strokeWidth={1.8} aria-hidden="true" />
          Transcrição agora
        </div>
        <p className={parcial ? styles.falaParcial : undefined}>{fala}</p>
        {falha && <small role="status">{falha}</small>}
      </section>

      <footer>
        <span className={styles.gravacao} data-estado={gravacao}>
          <Circle size={8} fill="currentColor" strokeWidth={0} aria-hidden="true" />
          {ROTULO_GRAVACAO[gravacao]}
        </span>
        <span>
          <Radio size={13} strokeWidth={1.8} aria-hidden="true" />
          Ao encerrar: resumo, decisões e próximo passo na ficha do cliente
        </span>
      </footer>
    </aside>
  );
}
