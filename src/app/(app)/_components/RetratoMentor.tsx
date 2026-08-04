import type { CSSProperties } from 'react';
import { fatia, hashDeterminista } from './hashDeterminista';
import { iniciais } from './iniciais';
import styles from './RetratoMentor.module.css';

/**
 * O retrato de um mentor — foto real quando existe, campo GERADO quando não.
 *
 * POR QUE NÃO HÁ FOTO DE BANCO DE IMAGENS AQUI, e isso não é falta de capricho.
 * Um rosto de stock apresentado como mentor da comunidade é identidade
 * fabricada: a pessoa que vê acredita que aquele ser humano dá aquela sessão. A
 * casa proíbe pelo nome ("nenhum avatar silhueta é apresentado como membro
 * real"), e o motivo é de exposição — CDC/CONAR —, não estético.
 *
 * O FALLBACK TAMBÉM NÃO É UMA SILHUETA CINZA. Silhueta é o desenho de uma pessoa
 * genérica; ela finge o mesmo que a foto de stock fingiria, com menos convicção.
 * Aqui o fallback é um campo de luz derivado do NOME — abstrato, nunca confundido
 * com um retrato, e ainda assim único por mentor. É a mesma técnica que o pôster
 * sintético das formações usa quando não há capa, e pelo mesmo motivo.
 *
 * A PALETA NÃO SE ABRE. O que o hash varia é POSIÇÃO e ÂNGULO, nunca matiz: as
 * cores continuam saindo dos tokens (`--via-accent` sobre `--via-navy`), porque
 * "cores só por token" é regra com gate. Um gerador que sorteasse hue seria a
 * porta de entrada do roxo "IA" que a marca bane.
 *
 * Server Component — não usa hook nenhum. Renderiza igual dos dois lados.
 */
type Tamanho = 'xs' | 'sm' | 'md' | 'lg';

export function RetratoMentor({
  nome,
  fotoUrl,
  tamanho = 'md',
  className,
}: {
  nome: string;
  fotoUrl?: string | null;
  tamanho?: Tamanho;
  className?: string;
}) {
  const h = hashDeterminista(nome);

  /* Posições contínuas, não uma lista de variantes — ver `fatia`. A luz fica na
     metade de cima porque é de onde a luz vem, e porque embaixo moram as
     iniciais. */
  const campo = {
    '--retrato-x': `${(14 + fatia(h, 0) * 72).toFixed(1)}%`,
    '--retrato-y': `${(2 + fatia(h, 8) * 44).toFixed(1)}%`,
    '--retrato-ang': `${104 + (h % 132)}deg`,
    '--retrato-forca': `${(16 + fatia(h, 16) * 16).toFixed(0)}%`,
  } as CSSProperties;

  return (
    <span
      className={`${styles.retrato} ${className ?? ''}`}
      data-tamanho={tamanho}
      style={fotoUrl ? undefined : campo}
      data-gerado={fotoUrl ? undefined : ''}
    >
      {fotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- a foto vem do Storage com URL externa; next/image exige domínio configurado e entra na fase de assets
        <img src={fotoUrl} alt="" className={styles.foto} loading="lazy" />
      ) : (
        <span className={styles.iniciais} aria-hidden="true">
          {iniciais(nome)}
        </span>
      )}
    </span>
  );
}
