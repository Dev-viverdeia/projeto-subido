'use client';

import { useRef } from 'react';
import {
  AudioLines,
  ChevronDown,
  Circle,
  History,
  LockKeyhole,
  MessageCircle,
  X,
} from 'lucide-react';
import type { PlanoCall } from '@/lib/calls/plano';
import type { TipoCall } from '@/lib/calls/tipos';
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
  criada_em?: string;
};

const ROTULO_ESTADO: Record<EstadoCoach, string> = {
  conectando: 'Conectando inteligência',
  escutando: 'Escutando a conversa',
  analisando: 'Lendo o momento',
  indisponivel: 'Orientação pausada',
};
const ROTULO_GRAVACAO: Record<EstadoGravacaoUi, string> = {
  iniciando: 'Preparando memória',
  pendente: 'Preparando memória',
  gravando: 'Gravação protegida',
  processando: 'Salvando gravação',
  concluida: 'Gravação preservada',
  falhou: 'Gravação indisponível',
  indisponivel: 'Gravação indisponível',
};

export function CabineLiveCoach({
  ativo,
  estado,
  sugestao,
  fala,
  parcial = false,
  falha = '',
  gravacao = 'iniciando',
  plano = null,
  tipo = 'descoberta',
  historico = [],
  onOcultar,
}: {
  ativo: boolean;
  estado: EstadoCoach;
  sugestao: SugestaoLive | null;
  fala: string;
  parcial?: boolean;
  falha?: string;
  gravacao?: EstadoGravacaoUi;
  plano?: PlanoCall | null;
  tipo?: TipoCall;
  historico?: SugestaoLive[];
  onOcultar?: () => void;
}) {
  const kickoff = tipo === 'kickoff';
  const comecou = Boolean(fala.trim()) && !fala.startsWith('Aguardando');
  const abertura = !comecou && ativo ? plano?.perguntas[0]?.pergunta : null;
  const anteriores = historico.filter((item) => item.id !== sugestao?.id);
  const perguntaRef = useRef<HTMLHeadingElement>(null);

  return (
    <aside
      className={styles.painel}
      aria-label={kickoff ? 'Acordo do projeto privado' : 'Live Coach privado'}
      tabIndex={0}
    >
      <header className={styles.cabecalho}>
        <span
          className={styles.estado}
          data-ativo={estado === 'escutando' || estado === 'analisando'}
          aria-hidden="true"
        >
          <i />
          <i />
          <i />
        </span>
        <div>
          <p>{kickoff ? 'Acordo do projeto' : ativo ? 'Coach da reunião' : 'Memória da reunião'}</p>
          <span>{ROTULO_ESTADO[estado]}</span>
        </div>
        <span className={styles.privado} title="Este painel não aparece para o cliente">
          <LockKeyhole size={15} aria-hidden="true" />
          <span>Só você vê</span>
        </span>
      </header>

      {falha && (
        <p className={styles.alerta} role="alert">
          {falha}
        </p>
      )}

      <div className={styles.conteudo}>
        <section className={styles.recomendacao} aria-label="Orientação atual">
          <div className={styles.rotuloSecao}>
            <MessageCircle size={17} aria-hidden="true" />
            {abertura
              ? 'Para abrir a conversa'
              : kickoff
                ? 'Próximo ponto a confirmar'
                : 'Próxima pergunta'}
          </div>
          <div aria-live="polite" aria-atomic="true">
            <h2 ref={perguntaRef} tabIndex={-1}>
              {sugestao?.sugestao ??
                abertura ??
                (ativo ? 'Dê espaço para o cliente.' : 'Foque na conversa.')}
            </h2>
            {!sugestao && !abertura && (
              <p className={styles.apoio}>
                {ativo
                  ? 'Uma nova orientação aparece quando houver algo útil a explorar.'
                  : 'Os trechos ficam na ficha ao encerrar.'}
              </p>
            )}
          </div>
          {sugestao && (
            <div className={styles.acoes}>
              <details key={sugestao.id} className={styles.motivo}>
                <summary>
                  Por que perguntar <ChevronDown size={15} aria-hidden="true" />
                </summary>
                <p>{sugestao.titulo}</p>
                {sugestao.trecho_gatilho && <blockquote>“{sugestao.trecho_gatilho}”</blockquote>}
              </details>
              {onOcultar && (
                <button
                  type="button"
                  className={styles.ocultar}
                  onClick={() => {
                    onOcultar();
                    perguntaRef.current?.focus();
                  }}
                  aria-label="Ocultar orientação atual"
                >
                  <X size={16} aria-hidden="true" />
                  <span>Ocultar</span>
                </button>
              )}
            </div>
          )}
        </section>

        {anteriores.length > 0 && (
          <details className={styles.detalhe}>
            <summary>
              <History size={17} aria-hidden="true" /> Orientações anteriores{' '}
              <span className={styles.contagem}>{anteriores.length}</span>
              <ChevronDown size={16} aria-hidden="true" />
            </summary>
            <ol className={styles.historico}>
              {anteriores.map((item) => (
                <li key={item.id}>{item.sugestao}</li>
              ))}
            </ol>
          </details>
        )}
        <details className={styles.detalhe}>
          <summary>
            <AudioLines size={17} aria-hidden="true" /> Última fala{' '}
            <ChevronDown size={16} aria-hidden="true" />
          </summary>
          <section aria-label="Trecho da conversa" className={styles.transcricao}>
            <p className={parcial ? styles.falaParcial : undefined}>
              {fala || 'Aguardando a primeira fala…'}
            </p>
          </section>
        </details>
        {ativo && plano && (
          <details className={styles.detalhe}>
            <summary>
              Objetivo da conversa <ChevronDown size={16} aria-hidden="true" />
            </summary>
            <p>{plano.objetivo}</p>
            {kickoff && <p>Resultado · Responsáveis · Acessos · Limites</p>}
          </details>
        )}
      </div>

      <footer>
        <span className={styles.gravacao} data-estado={gravacao}>
          <Circle size={8} fill="currentColor" strokeWidth={0} aria-hidden="true" />
          {ROTULO_GRAVACAO[gravacao]}
        </span>
        <span>{kickoff ? 'Acordo para revisar ao encerrar' : 'Resumo na ficha ao encerrar'}</span>
      </footer>
    </aside>
  );
}
