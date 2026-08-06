'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROTULOS, rotuloDaRota } from '@/lib/routes';
import { useTrilha, type Trilha } from './contexto';
import styles from './TrilhaDoCabecalho.module.css';

/**
 * O lado esquerdo do cabeçalho — uma TRILHA em toda tela.
 *
 * UMA GRAMÁTICA SÓ, e é isso que esta versão conserta. Antes a listagem mostrava
 * o nome da seção como título de 32px e o detalhe mostrava uma trilha de 14px: a
 * barra trocava de altura e de peso ao navegar, e lia como dois cabeçalhos
 * diferentes. Agora a forma é sempre a mesma; o que muda é quantos degraus ela
 * tem — dois na listagem, dois ou três no detalhe.
 *
 * O CAMINHO DE RENDER É ÚNICO. A trilha ou vem declarada pela tela
 * (`DefinirTrilha`) ou é derivada da rota. Duas fontes, uma renderização — sem
 * `if` de layout, que é o que fazia as duas versões divergirem em detalhe
 * tipográfico.
 *
 * NÃO USA O `Breadcrumb` DO DS por dois motivos medidos: ele navega com
 * `<a href>`, o que faz recarga completa e perderia os filtros do catálogo que
 * vivem na URL; e importa `lucide`, que aqui é cliente e viraria bundle. O
 * chevron é SVG inline.
 */
function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M10 3.5 5.5 8l4.5 4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const INICIO = '/inicio';

/**
 * O rótulo do degrau atual, encurtado NA PALAVRA.
 *
 * POR QUE NO COMPONENTE E NÃO EM CADA CHAMADOR. O truncamento por CSS resolve o
 * pixel e não resolve o resto: o elemento com `aria-current="page"` continua
 * carregando a string inteira, e o leitor de tela lê os 300 caracteres da ideia
 * do Builder de ponta a ponta. Cortar aqui protege TODA tela de uma vez, inclusive
 * as que ainda não existem — e um chamador não precisa saber que o cabeçalho tem
 * limite.
 *
 * 72 caracteres é o teto: acima disso o degrau já não cabe em nenhuma largura sem
 * reticências, e o que sobra deixou de ser identificação para virar leitura.
 *
 * CORTE NA PALAVRA e não no caractere. "Meu cliente tem uma clíni…" lê como texto
 * quebrado; "Meu cliente tem uma clínica com 4…" lê como resumo. A diferença é um
 * `lastIndexOf(' ')`.
 */
const TETO = 72;

export function encurtar(texto: string): string {
  const limpo = texto.replace(/\s+/g, ' ').trim();
  if (limpo.length <= TETO) return limpo;

  const corte = limpo.slice(0, TETO);
  const espaco = corte.lastIndexOf(' ');
  /* Sem espaço no trecho (uma palavra gigante, um slug colado) o corte seco é o
     único possível — e aí as reticências são a única pista mesmo. */
  return `${espaco > TETO * 0.6 ? corte.slice(0, espaco) : corte}…`;
}

/**
 * A trilha de uma tela de LISTAGEM, derivada só da rota.
 *
 * Exportada porque é lógica pura e tem teste próprio — e porque o caso de borda
 * dela não é óbvio: em `/inicio` não existe para onde voltar, então o degrau é
 * único. Sem isso o cabeçalho diria "‹ Início / Início".
 */
export function trilhaDaSecao(caminho: string): Trilha | null {
  const secao = rotuloDaRota(caminho);
  if (!secao) return null;
  if (caminho === INICIO) return { atual: secao };
  return { voltarPara: INICIO, voltarRotulo: ROTULOS[INICIO], atual: secao };
}

export function TrilhaDoCabecalho() {
  const declarada = useTrilha();
  const caminho = usePathname();

  const trilha = declarada ?? trilhaDaSecao(caminho);
  if (!trilha) return null;

  const voltarPara = trilha.voltarPara;
  const voltarRotulo = trilha.voltarRotulo;

  return (
    <nav className={styles.trilha} aria-label="Caminho de navegação">
      {voltarPara && voltarRotulo && (
        <>
          <Link href={voltarPara} className={styles.voltar}>
            <Chevron />
            {voltarRotulo}
          </Link>
          <span className={styles.barra} aria-hidden="true">
            /
          </span>
        </>
      )}

      {trilha.meio && (
        <>
          <span className={styles.meio}>{trilha.meio}</span>
          <span className={styles.barra} aria-hidden="true">
            /
          </span>
        </>
      )}

      {/* `aria-current="page"` é o que diz ao leitor de tela qual degrau é o
          atual — sem ele a trilha vira três textos soltos. */}
      {/* `title` com o texto INTEIRO: encurtar não pode custar a informação para
          quem quer conferir onde está. */}
      <span className={styles.atual} aria-current="page" title={trilha.atual}>
        {encurtar(trilha.atual)}
      </span>
    </nav>
  );
}
