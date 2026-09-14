'use client';

import { useId, type ReactNode } from 'react';
import { LockKeyhole } from 'lucide-react';
import { RoteiroPreparacao } from '@/components/calls/RoteiroPreparacao';
import type { PlanoCall } from '@/lib/calls/plano';
import type { TipoCall } from '@/lib/calls/tipos';
import { ROTULO_GRAVACAO, type EstadoGravacaoUi } from './CabineLiveCoach';
import styles from './PainelPrivadoSala.module.css';
import { usePosicaoRoteiro } from './usePosicaoRoteiro';

/** Consulta local: não inicia mídia, não gera perguntas e não registra respostas. */
export function PainelPrivadoSala({
  plano,
  tipo,
  children,
  ativo,
  gravacao,
  reuniaoId,
}: {
  plano: PlanoCall | null;
  tipo: TipoCall;
  children: ReactNode;
  ativo: boolean;
  gravacao: EstadoGravacaoUi;
  reuniaoId?: string;
}) {
  const id = useId();
  const { posicao, atualizar } = usePosicaoRoteiro(reuniaoId, plano, tipo);
  const { consulta } = posicao;
  const setConsulta = (valor: typeof consulta) => atualizar({ consulta: valor });

  return (
    <aside className={styles.painel} aria-label="Apoio privado da reunião">
      <header className={styles.cabecalho}>
        <h2>Seu apoio na conversa</h2>
        <details className={styles.privacidade}>
          <summary>
            <LockKeyhole size={16} aria-hidden="true" /> Privado
          </summary>
          <p>O cliente não recebe este painel. Se compartilhar a tela inteira, ele poderá vê-lo.</p>
        </details>
      </header>
      <nav className={styles.consultas} aria-label="Consultar durante a reunião">
        <button
          type="button"
          aria-pressed={consulta === 'roteiro'}
          aria-controls={`${id}-roteiro`}
          onClick={() => setConsulta('roteiro')}
        >
          Roteiro
        </button>
        <button
          type="button"
          aria-pressed={consulta === 'ao-vivo'}
          aria-controls={`${id}-ao-vivo`}
          onClick={() => setConsulta('ao-vivo')}
        >
          Ao vivo
        </button>
      </nav>
      <div className={styles.conteudo} id={`${id}-roteiro`} hidden={consulta !== 'roteiro'}>
        {plano ? (
          <>
            <RoteiroPreparacao
              plano={plano}
              kickoff={tipo === 'kickoff'}
              compacto
              navegacao={{ posicao, aoMudar: atualizar }}
            />
            <details className={styles.objetivo}>
              <summary>Objetivo da reunião</summary>
              <p>{plano.objetivo}</p>
            </details>
          </>
        ) : (
          <div className={styles.vazio}>
            <h3>Roteiro indisponível</h3>
            <p>A reunião pode continuar. Combine com o cliente o objetivo e o próximo passo.</p>
            <button type="button" onClick={() => setConsulta('ao-vivo')}>
              Ver acompanhamento ao vivo
            </button>
          </div>
        )}
      </div>
      {/* Ocultar a consulta não desmonta a captura ou o encerramento da reunião. */}
      <div className={styles.aoVivo} id={`${id}-ao-vivo`} hidden={consulta !== 'ao-vivo'}>
        {children}
      </div>
      <footer className={styles.estado}>
        <span role="status">{ROTULO_GRAVACAO[gravacao]}</span>
        {!ativo && <span>Live Coach desligado</span>}
      </footer>
    </aside>
  );
}
