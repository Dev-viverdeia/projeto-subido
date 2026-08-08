import Link from 'next/link';
import type { VizinhaSolucao } from '@/lib/conteudo/queries';
import styles from './ProximaSolucao.module.css';

/**
 * O card navy do fim da coluna de apoio: o que vem depois desta solução.
 *
 * A ÚNICA SUPERFÍCIE ESCURA DA TELA, e é de propósito — a ficha inteira é clara,
 * então a banda navy aqui não é decoração: é o único momento em que a página
 * muda de tom, e ele coincide com a única pergunta que sobra depois de implantar
 * ("e agora?"). Duas bandas escuras nesta tela e a hierarquia se anula.
 *
 * O SUBTÍTULO MUDA CONFORME O PARENTESCO É VERDADE. Com uma vizinha da mesma
 * categoria, o card afirma que a trilha continua; sem ela, diz apenas que existe
 * uma próxima no catálogo. É a diferença entre descrever o dado e enfeitá-lo.
 *
 * Sobre navy, tinta clara é `--via-gray-300` (12,2:1) ou `--via-gray-400`
 * (6,99:1). Nunca `--via-text-soft`, que ali cai para 3,45:1.
 */
export function ProximaSolucao({ proxima }: { proxima: VizinhaSolucao }) {
  return (
    <Link href={`/solucoes/${proxima.slug}`} className={`${styles.card} via-noise`}>
      <p className={styles.eyebrow}>Próximo projeto</p>
      <p className={styles.titulo}>{proxima.titulo}</p>

      <span className={styles.rodape}>
        {proxima.mesmaTrilha && proxima.categoria
          ? `Continua a trilha de ${proxima.categoria}`
          : 'Continuar no catálogo'}
        <svg
          className={styles.seta}
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 8h9m0 0L8.5 4.5M12 8l-3.5 3.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </Link>
  );
}
