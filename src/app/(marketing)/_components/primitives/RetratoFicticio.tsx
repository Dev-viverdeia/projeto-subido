import Image, { type StaticImageData } from 'next/image';
import styles from './RetratoFicticio.module.css';

export interface RetratoFicticioProps {
  /** Nome de quem o retrato representa. Decide TODAS as feições, de forma estável. */
  nome: string;
  /**
   * FOTO DE VERDADE. Quando existe, ela ganha e a ilustração nem é desenhada.
   *
   * É o caminho pretendido: a ilustração é o que se mostra ENQUANTO não há foto, não
   * o destino. Import estático (`import x from '@/assets/img/x.jpg'`), para o Next
   * conhecer as dimensões e não haver CLS.
   */
  foto?: StaticImageData;
  /** Lado do círculo em px. */
  tamanho?: number;
  /** `dark` troca a hairline de contato para banda escura. */
  tone?: 'light' | 'dark';
  className?: string;
}

/**
 * Retrato ILUSTRADO, para onde ainda não existe fotografia.
 *
 * É ILUSTRAÇÃO E PRECISA PARECER ILUSTRAÇÃO. Um rosto desenhado ao lado de um
 * depoimento assinado preenche a composição sem afirmar que aquela pessoa existe —
 * e essa distinção é o ponto inteiro. Foto de banco no mesmo lugar afirmaria, e
 * trocar "depoimento sem rosto" por "depoimento com o rosto errado" é o que o
 * CLAUDE.md descreve como capaz de derrubar esta página, porque todo o resto dela é
 * construído sobre atribuição.
 *
 * TUDO É DETERMINÍSTICO PELO NOME. `Math.random()` daria um rosto diferente a cada
 * render e faria a hidratação divergir do servidor — a mesma pessoa teria uma cara no
 * HTML e outra depois do JS. Aqui a soma dos códigos do nome escolhe pele, cabelo,
 * roupa e feições, então Rafael Nunes é sempre o mesmo Rafael Nunes.
 *
 * SVG INLINE e não `<img src>`: dentro de `<img>` o SVG é documento isolado e não
 * enxerga os tokens `--via-*`, então a roupa e o fundo teriam que ser hex literal em
 * vez de cor da marca. Inline herda tudo e continua Server Component, zero JS.
 */

/* Pele, cabelo e tinta da feição são declaradas no módulo CSS, com o motivo escrito
   lá: não são paleta da marca e não podem virar token `--via-*`. Aqui o componente só
   ESCOLHE qual, nunca inventa o valor. */
const PELE = ['var(--rf-pele-0)', 'var(--rf-pele-1)', 'var(--rf-pele-2)', 'var(--rf-pele-3)'];
const CABELO = [
  'var(--rf-cabelo-0)',
  'var(--rf-cabelo-1)',
  'var(--rf-cabelo-2)',
  'var(--rf-cabelo-3)',
];
/* A roupa, sim, é da marca: é a única parte que encosta na paleta da página. */
const ROUPA = [
  'var(--via-navy)',
  'var(--via-accent-ink)',
  'var(--via-gray-700)',
  'var(--via-navy-deep)',
];
const FUNDO = ['var(--via-gray-200)', 'var(--via-gray-300)', 'var(--via-navy-08)'];

function somaDoNome(nome: string) {
  let soma = 0;
  for (let i = 0; i < nome.length; i += 1) soma += nome.charCodeAt(i) * (i + 1);
  return soma;
}

export function RetratoFicticio({
  nome,
  foto,
  tamanho = 56,
  tone = 'light',
  className,
}: RetratoFicticioProps) {
  if (foto) {
    return (
      <span
        className={[styles.moldura, tone === 'dark' && styles.escuro, className]
          .filter(Boolean)
          .join(' ')}
        style={{ ['--retrato-lado' as string]: `${tamanho}px` }}
      >
        {/* `cover` porque a moldura é redonda e o enquadramento é dela: `contain`
            deixaria barras nas laterais dentro do círculo. `sizes` fixo porque o
            retrato tem tamanho conhecido — sem ele o Next serve variante de 100vw. */}
        <Image src={foto} alt={nome} className={styles.foto} sizes={`${tamanho * 2}px`} />
      </span>
    );
  }

  const s = somaDoNome(nome);
  const pele = PELE[s % PELE.length]!;
  const cabelo = CABELO[(s >> 2) % CABELO.length]!;
  const roupa = ROUPA[(s >> 3) % ROUPA.length]!;
  const fundo = FUNDO[(s >> 5) % FUNDO.length]!;
  const penteado = (s >> 4) % 4;
  const barba = s % 3 === 0;

  /* Id único por instância: dois `<clipPath>` com o mesmo id na mesma página fazem
     todos os retratos usarem o primeiro. Derivado do nome, não de contador, para não
     depender da ordem de render. */
  const id = `rf-${nome.toLowerCase().replace(/[^a-z]/g, '')}`;

  return (
    <span
      className={[styles.moldura, tone === 'dark' && styles.escuro, className]
        .filter(Boolean)
        .join(' ')}
      style={{ ['--retrato-lado' as string]: `${tamanho}px` }}
    >
      <svg viewBox="0 0 100 100" role="img" aria-label={`Ilustração de ${nome}`}>
        <defs>
          {/* Recorta tudo no círculo: os ombros são maiores que a moldura de propósito,
              para o busto encostar nas bordas em vez de flutuar no meio dela. */}
          <clipPath id={`${id}-corte`}>
            <circle cx="50" cy="50" r="50" />
          </clipPath>
        </defs>

        <g clipPath={`url(#${id}-corte)`}>
          <circle cx="50" cy="50" r="50" fill={fundo} />

          {/* Ombros primeiro: o pescoço e a cabeça pintam por cima. */}
          <ellipse cx="50" cy="103" rx="35" ry="31" fill={roupa} />
          <rect x="43" y="60" width="14" height="16" rx="7" fill={pele} />

          {penteado === 2 && <ellipse cx="50" cy="52" rx="27" ry="30" fill={cabelo} />}

          <ellipse cx="50" cy="45" rx="21" ry="24" fill={pele} />

          {/* Penteados: 0 curto, 1 com topete, 2 comprido (já pintado atrás), 3 raspado. */}
          {penteado === 0 && <path d="M29 42a21 24 0 0 1 42 0c-6-9-36-9-42 0Z" fill={cabelo} />}
          {penteado === 1 && (
            <path
              d="M29 43c-1-14 9-22 21-22s22 8 21 22c-4-12-14-13-21-9-6 3-14 2-21 9Z"
              fill={cabelo}
            />
          )}
          {penteado === 2 && <path d="M29 43a21 24 0 0 1 42 0c-5-11-37-11-42 0Z" fill={cabelo} />}
          {penteado === 3 && (
            <path d="M31 40a19 19 0 0 1 38 0c-6-6-32-6-38 0Z" fill={cabelo} opacity="0.55" />
          )}

          {barba && (
            <path
              d="M31 47c0 16 8 24 19 24s19-8 19-24c-2 14-9 17-19 17s-17-3-19-17Z"
              fill={cabelo}
              opacity="0.9"
            />
          )}

          {/* Feições reduzidas ao essencial: a 40px qualquer detalhe a mais vira sujeira.
              Sem boca sorridente desenhada — sorriso ilustrado genérico é a assinatura
              de avatar de banco, e a régua da casa recusa ornamento sem função. */}
          <ellipse cx="42" cy="45" rx="2.1" ry="2.4" fill="var(--rf-feicao)" opacity="0.82" />
          <ellipse cx="58" cy="45" rx="2.1" ry="2.4" fill="var(--rf-feicao)" opacity="0.82" />
          <path
            d="M44 56c2 2 10 2 12 0"
            stroke="var(--rf-feicao)"
            strokeOpacity="0.35"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      </svg>
    </span>
  );
}
