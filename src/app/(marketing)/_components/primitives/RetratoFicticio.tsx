import styles from './RetratoFicticio.module.css';

export interface RetratoFicticioProps {
  /** Nome de quem o retrato representa. Decide o monograma E a variante de cor. */
  nome: string;
  /** Lado do círculo em px. Ignorado em `forma="retrato"`, que preenche o pai. */
  tamanho?: number;
  /** `dark` inverte a superfície para banda escura. */
  tone?: 'light' | 'dark';
  /**
   * `circulo` — avatar ao lado de um nome (depoimento, lista, chip).
   * `retrato` — a moldura 3:4 de uma seção de autoridade, que preenche o contêiner.
   */
  forma?: 'circulo' | 'retrato';
  className?: string;
}

/**
 * Retrato desenhado, para onde ainda não existe fotografia.
 *
 * POR QUE NÃO É UMA FOTO, e a decisão é de risco e não de gosto: um rosto de banco
 * de imagens ao lado de um depoimento assinado afirma que aquela pessoa disse aquilo.
 * Troca "depoimento sem rosto" por "depoimento com o rosto errado", que é pior — e é
 * a única coisa que o CLAUDE.md diz ser capaz de derrubar esta página, porque todo o
 * resto dela é construído sobre atribuição. Um retrato abstrato preenche a composição
 * sem afirmar ninguém.
 *
 * POR QUE NÃO É `<img src>`: SVG dentro de `<img>` é documento isolado — não enxerga
 * a Outfit carregada pela página nem os tokens `--via-*`, então o monograma sairia
 * numa fonte de sistema e as cores teriam que ser hex literal. Inline, ele herda as
 * duas coisas, e continua custando zero JS por ser Server Component.
 *
 * A VARIANTE É DETERMINÍSTICA pelo nome, não aleatória: `Math.random()` daria um
 * retrato diferente a cada render e faria hidratação divergir do servidor. Mesma
 * pessoa, mesmo retrato, sempre.
 */
const VARIANTES = [
  { fundo: 'var(--via-navy)', brilho: 'var(--via-accent)', tinta: 'var(--via-white)' },
  { fundo: 'var(--via-accent-ink)', brilho: 'var(--via-accent)', tinta: 'var(--via-white)' },
  { fundo: 'var(--via-navy-deep)', brilho: 'var(--via-navy-40)', tinta: 'var(--via-white)' },
  { fundo: 'var(--via-gray-700)', brilho: 'var(--via-gray-400)', tinta: 'var(--via-white)' },
] as const;

function iniciais(nome: string) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('');
}

/** Soma dos códigos do nome. Estável entre servidor e cliente, que é o requisito. */
function variantePara(nome: string) {
  let soma = 0;
  for (let i = 0; i < nome.length; i += 1) soma += nome.charCodeAt(i);
  return VARIANTES[soma % VARIANTES.length]!;
}

export function RetratoFicticio({
  nome,
  tamanho = 56,
  tone = 'light',
  forma = 'circulo',
  className,
}: RetratoFicticioProps) {
  const v = variantePara(nome);
  const mono = iniciais(nome);
  const retrato = forma === 'retrato';
  /* O id do gradiente precisa ser único por instância: dois `<defs>` com o mesmo id na
     mesma página fazem todos os círculos usarem o primeiro. Derivado do nome, não de
     contador, para não depender de ordem de render. */
  const id = `retrato-${nome.toLowerCase().replace(/[^a-z]/g, '')}`;

  return (
    <span
      className={[
        styles.moldura,
        retrato && styles.retrato,
        tone === 'dark' && styles.escuro,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={retrato ? undefined : { ['--retrato-lado' as string]: `${tamanho}px` }}
    >
      {/* `preserveAspectRatio="none"` na forma retrato: a luz é um campo, não um
          desenho — esticar não deforma nada reconhecível, e evita ter que manter dois
          viewBox. No círculo o padrão (uniforme) é o certo. */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio={retrato ? 'none' : undefined}
        aria-hidden="true"
      >
        <defs>
          {/* Duas fontes de luz, como o halo do hero: uma quente no alto à esquerda
              (a mesma direção da luz do retrato real) e a superfície por baixo. */}
          <radialGradient id={`${id}-luz`} cx="32%" cy="26%" r="78%">
            <stop offset="0%" stopColor={v.brilho} stopOpacity="0.55" />
            <stop offset="62%" stopColor={v.fundo} stopOpacity="1" />
            <stop offset="100%" stopColor={v.fundo} stopOpacity="1" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill={`url(#${id}-luz)`} />
      </svg>

      {/* O monograma é TEXTO no DOM, não `<text>` no SVG: assim ele herda a Outfit da
          página, respeita zoom de fonte e é selecionável como qualquer outro texto. */}
      <span className={styles.mono} style={{ color: v.tinta }} aria-hidden="true">
        {mono}
      </span>
    </span>
  );
}
