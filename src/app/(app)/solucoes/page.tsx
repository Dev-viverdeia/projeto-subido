import type { Metadata } from 'next';
import { listarSolucoes } from '@/lib/conteudo/queries';
import { CabecalhoPagina } from '../_components/CabecalhoPagina';
import { lerFiltrosIniciais } from '../_components/filtros/urlFiltros';
import entrada from '../_components/entrada.module.css';
import { CatalogoSolucoes } from './_components/CatalogoSolucoes';
import { ResumoSolucoes } from './_components/ResumoSolucoes';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'Projetos' };

export default async function SolucoesPage({ searchParams }: PageProps<'/solucoes'>) {
  const [solucoes, params] = await Promise.all([listarSolucoes(), searchParams]);

  return (
    <div className={styles.pagina}>
      <CabecalhoPagina titulo="Projetos" oculto />

      {/* A faixa de resumo vem ANTES da régua de filtros: ela responde "onde eu
          estou" e o filtro responde "o que eu procuro". Invertido, a pessoa
          escolheria um recorte antes de saber que tem algo pela metade. */}
      <div className={entrada.bloco}>
        <ResumoSolucoes solucoes={solucoes} />
      </div>

      <div className={`${entrada.bloco} ${entrada.atraso1}`}>
        <CatalogoSolucoes solucoes={solucoes} filtrosIniciais={lerFiltrosIniciais(params)} />
      </div>
    </div>
  );
}
