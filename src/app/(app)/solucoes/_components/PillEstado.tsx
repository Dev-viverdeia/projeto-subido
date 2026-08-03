import type { EstadoSolucao } from '@/lib/progresso/local';
import styles from './PillEstado.module.css';

/**
 * O selo de estado de uma solução — UM só, para o card e para a ficha.
 *
 * Nasceu dentro do `CartaoSolucao`. Saiu de lá quando a ficha passou a mostrar o
 * mesmo estado no cabeçalho: duas cópias do mesmo selo divergem na primeira vez
 * que alguém ajusta uma delas, e a divergência aparece exatamente na transição
 * catálogo → detalhe, que é onde a pessoa compara os dois.
 *
 * Sem `'use client'` de propósito: não usa hook nenhum. Assim serve tanto ao card
 * (cliente) quanto a qualquer Server Component que precise dele, sem duplicar.
 */
const ROTULO: Record<Exclude<EstadoSolucao, 'sem-etapas'>, string> = {
  'nao-iniciada': 'não iniciada',
  'em-andamento': 'em andamento',
  concluida: 'concluída',
};

/** Check inline — quem importa isto é cliente, e `lucide` viraria bundle. */
export function Visto({ tamanho = 10 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2.5 6.2 4.8 8.5 9.5 3.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PillEstado({ estado, className }: { estado: EstadoSolucao; className?: string }) {
  /* `sem-etapas` não é um estado exibível: uma solução sem passo a passo
     cadastrado não está "não iniciada", ela não tem o que iniciar. */
  if (estado === 'sem-etapas') return null;

  return (
    <span className={`${styles.estado} ${className ?? ''}`} data-estado={estado}>
      {estado === 'em-andamento' && <span className={styles.ponto} aria-hidden="true" />}
      {estado === 'concluida' && <Visto />}
      {ROTULO[estado]}
    </span>
  );
}
