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

  /**
   * TRÊS FONTES DE LUZ, não uma. A versão anterior tinha um radial só sobre um
   * linear, e o resultado era chapado: variava de peça para peça, mas cada peça
   * isolada era uma mancha sem forma.
   *
   * A composição agora é a de um retrato de estúdio, que é de onde a ideia vem:
   * uma PRINCIPAL forte no alto (a key light), uma SECUNDÁRIA fria e larga do
   * lado oposto (a fill, que impede a metade escura de virar um buraco preto) e
   * uma base linear inclinada.
   *
   * AS DUAS LUZES SAEM DE BANDAS SEPARADAS, e a primeira tentativa disto estava
   * errada: eu espelhei a secundária com `100 − x` e escrevi no comentário que
   * isso garantia 22 pontos de distância. Não garante nada — com x ≈ 50 as duas
   * caem no mesmo lugar e a distância é ZERO. O teste mediu 18,4 num dos nomes e
   * reprovou antes de o commit sair. Agora cada luz é sorteada dentro da sua
   * própria banda (12–38 e 62–88) e um bit do hash decide qual delas fica à
   * esquerda: a separação mínima passa a ser 24 pontos POR CONSTRUÇÃO.
   *
   * A luz principal fica na metade de CIMA porque é de onde a luz vem, e porque
   * embaixo moram as iniciais: luz atrás de texto é contraste perdido.
   *
   * Posições contínuas, nunca uma lista de variantes — ver `fatia`.
   */
  const banda = { esquerda: 12 + fatia(h, 0) * 26, direita: 62 + fatia(h, 16) * 26 };
  /* Um bit decide de que lado nasce a principal — sem ele todo retrato teria a
     key light do mesmo lado e a fileira leria como um padrão repetido. */
  const espelhar = (h & 1) === 1;

  const campo = {
    '--retrato-x': `${(espelhar ? banda.direita : banda.esquerda).toFixed(1)}%`,
    '--retrato-y': `${(4 + fatia(h, 8) * 34).toFixed(1)}%`,
    '--retrato-x2': `${(espelhar ? banda.esquerda : banda.direita).toFixed(1)}%`,
    '--retrato-y2': `${(58 + fatia(h, 24) * 34).toFixed(1)}%`,
    '--retrato-ang': `${104 + (h % 132)}deg`,
    '--retrato-forca': `${(26 + fatia(h, 8) * 20).toFixed(0)}%`,
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
