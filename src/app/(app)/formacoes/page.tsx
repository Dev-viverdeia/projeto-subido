import type { Metadata } from 'next';
import { listarFormacoes } from '@/lib/conteudo/queries';
import { CabecalhoPagina } from '../_components/CabecalhoPagina';
import { ContadorCatalogo } from '../_components/ContadorCatalogo';
import { lerFiltrosIniciais } from '../_components/filtros/urlFiltros';
import entrada from '../_components/entrada.module.css';
import { CatalogoFormacoes } from './_components/CatalogoFormacoes';
import { RetomadaFormacao } from './_components/RetomadaFormacao';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'Formações' };

export default async function FormacoesPage({ searchParams }: PageProps<'/formacoes'>) {
  const [formacoes, params] = await Promise.all([listarFormacoes(), searchParams]);

  return (
    <div className={styles.pagina}>
      <div className={entrada.bloco}>
        <CabecalhoPagina
          titulo="Formações"
          acao={<ContadorCatalogo total={formacoes.length} rotulo="formações publicadas" />}
          oculto
        />
      </div>

      <div className={`${entrada.bloco} ${entrada.atraso1}`}>
        <RetomadaFormacao formacoes={formacoes} />
      </div>

      <div className={`${entrada.bloco} ${entrada.atraso2}`}>
        <CatalogoFormacoes formacoes={formacoes} filtrosIniciais={lerFiltrosIniciais(params)} />
      </div>
    </div>
  );
}
