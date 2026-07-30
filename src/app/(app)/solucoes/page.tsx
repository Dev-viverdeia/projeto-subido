import type { Metadata } from 'next';
import { listarSolucoes } from '@/lib/conteudo/queries';
import { CabecalhoPagina } from '../_components/CabecalhoPagina';
import { lerFiltrosIniciais } from '../_components/filtros/urlFiltros';
import entrada from '../_components/entrada.module.css';
import { CatalogoSolucoes } from './_components/CatalogoSolucoes';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'Soluções de IA' };

export default async function SolucoesPage({ searchParams }: PageProps<'/solucoes'>) {
  const [solucoes, params] = await Promise.all([listarSolucoes(), searchParams]);

  return (
    <div className={styles.pagina}>
      <CabecalhoPagina titulo="Soluções de IA" oculto />

      <div className={entrada.bloco}>
        <CatalogoSolucoes solucoes={solucoes} filtrosIniciais={lerFiltrosIniciais(params)} />
      </div>
    </div>
  );
}
