import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import styles from './TrilhaCabecalho.module.css';

/**
 * A trilha do cabeçalho nas telas de DETALHE.
 *
 * Server Component — e é isso que permite o `lucide` aqui: em Server Component o
 * ícone custa zero JS. O `CabecalhoApp` recebe esta árvore já renderizada, pelo
 * mesmo caminho que o logotipo.
 *
 * POR QUE NÃO O `Breadcrumb` DO DS
 * Ele navega com `<a href>`, o que faz recarga completa dentro de uma SPA — a
 * volta para o catálogo perderia o estado dos filtros que vive na URL e a
 * rolagem. Aqui o primeiro degrau é `<Link>`, e o `‹` do começo diz que ele é
 * VOLTA, não migalha decorativa.
 *
 * TRÊS DEGRAUS NO MÁXIMO, e o do meio é opcional: seção, recorte (a categoria) e
 * onde a pessoa está. Uma trilha que cresce com a profundidade da rota vira uma
 * linha que ninguém lê — e o cabeçalho tem uma linha só.
 */
export function TrilhaCabecalho({
  voltarPara,
  voltarRotulo,
  meio,
  atual,
}: {
  voltarPara: string;
  voltarRotulo: string;
  /** Categoria, módulo, trilha — o recorte a que o item pertence. Some se não houver. */
  meio?: string | null;
  atual: string;
}) {
  return (
    <nav className={styles.trilha} aria-label="Caminho de navegação">
      <Link href={voltarPara} className={styles.voltar}>
        <ChevronLeft size={14} strokeWidth={2} aria-hidden="true" />
        {voltarRotulo}
      </Link>

      {meio && (
        <>
          <span className={styles.barra} aria-hidden="true">
            /
          </span>
          <span className={styles.meio}>{meio}</span>
        </>
      )}

      <span className={styles.barra} aria-hidden="true">
        /
      </span>
      {/* `aria-current="page"` é o que diz ao leitor de tela qual degrau é o
          atual — sem ele a trilha vira três textos soltos. */}
      <span className={styles.atual} aria-current="page">
        {atual}
      </span>
    </nav>
  );
}
