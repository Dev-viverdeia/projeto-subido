import type { EstadoProgresso } from '@/lib/progresso/local';
import styles from './PillEstado.module.css';

/**
 * O selo de estado de um conteúdo com progresso — UM só, para os dois pilares.
 *
 * Nasceu dentro do `CartaoSolucao`. Saiu de lá quando a ficha passou a mostrar o
 * mesmo estado no cabeçalho, e subiu para `(app)/_components` porque formações
 * precisa exatamente do mesmo selo: duas cópias divergem na primeira vez que
 * alguém ajusta uma delas, e a divergência aparece justo na transição entre
 * pilares, que é onde a pessoa compara os dois.
 *
 * `tom="onnavy"` NÃO é a mesma pill com outra cor — é a inversão da escala. Sobre
 * claro, "mais quieto" é mais escuro; sobre a banda navy isso inverte, e
 * `--via-text-muted` ali cai para 3,45:1. A variante escura usa `--via-gray-300`
 * (12,2:1) e o accent PURO, que sobre navy dá 6,52:1 — o único lugar da marca em
 * que esse azul é legível.
 *
 * Sem `'use client'` de propósito: não usa hook nenhum. Assim serve tanto ao card
 * (cliente) quanto a qualquer Server Component, sem duplicar.
 */
const ROTULO: Record<Exclude<EstadoProgresso, 'sem-itens'>, string> = {
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

export function PillEstado({
  estado,
  className,
  tom = 'claro',
}: {
  estado: EstadoProgresso;
  className?: string;
  /**
   * `midia` é o caso em que NÃO SE SABE o que está atrás.
   *
   * O selo do card de formação pousa sobre a capa que o admin sobe — uma imagem
   * que ninguém controla. Tanto o véu navy do tom claro quanto o véu branco do
   * `onnavy` são translúcidos: sobre uma foto clara ou de alto contraste, a
   * legibilidade vira sorte. Aqui o fundo é OPACO, e é por isso que a versão
   * original deste selo era branca sólida — a translucidez foi um retrocesso que
   * este tom desfaz.
   */
  tom?: 'claro' | 'onnavy' | 'midia';
}) {
  /* `sem-itens` não é um estado exibível: conteúdo sem etapa nem aula cadastrada
     não está "não iniciado" — ele não tem o que iniciar. */
  if (estado === 'sem-itens') return null;

  return (
    <span
      className={`${styles.estado} ${className ?? ''}`}
      data-estado={estado}
      data-tom={tom === 'claro' ? undefined : tom}
    >
      {estado === 'em-andamento' && <span className={styles.ponto} aria-hidden="true" />}
      {estado === 'concluida' && <Visto />}
      {ROTULO[estado]}
    </span>
  );
}
