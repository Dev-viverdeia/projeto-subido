import type { Metadata } from 'next';
import { listarFormacoes } from '@/lib/conteudo/queries';
import { CabecalhoPagina } from '../_components/CabecalhoPagina';
import { lerFiltrosIniciais } from '../_components/filtros/urlFiltros';
import entrada from '../_components/entrada.module.css';
import { CatalogoFormacoes } from './_components/CatalogoFormacoes';
import { ResumoFormacoes } from './_components/ResumoFormacoes';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'Formações' };

export default async function FormacoesPage({ searchParams }: PageProps<'/formacoes'>) {
  const [formacoes, params] = await Promise.all([listarFormacoes(), searchParams]);

  return (
    <div className={styles.pagina}>
      <CabecalhoPagina titulo="Formações" oculto />

      {/* A faixa de resumo vem ANTES da régua: ela responde "onde eu estou" e o
          filtro responde "o que eu procuro". Invertido, a pessoa escolheria um
          recorte antes de saber que tem algo pela metade. */}
      <div className={entrada.bloco}>
        <ResumoFormacoes formacoes={formacoes} />
      </div>

      <div className={`${entrada.bloco} ${entrada.atraso1}`}>
        <CatalogoFormacoes formacoes={formacoes} filtrosIniciais={lerFiltrosIniciais(params)} />
      </div>
    </div>
  );
}
