import type { Metadata } from 'next';
import { listarSolucoes } from '@/lib/conteudo/queries';
import { CabecalhoPagina } from '../_components/CabecalhoPagina';
import { ContadorCatalogo } from '../_components/ContadorCatalogo';
import { ICONES_CATEGORIAS, ICONE_CATEGORIA_PADRAO } from '../_components/iconesCategorias';
import { lerFiltrosIniciais } from '../_components/filtros/urlFiltros';
import entrada from '../_components/entrada.module.css';
import { CatalogoSolucoes } from './_components/CatalogoSolucoes';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'Soluções' };

export default async function SolucoesPage({ searchParams }: PageProps<'/solucoes'>) {
  const [solucoes, params] = await Promise.all([listarSolucoes(), searchParams]);

  return (
    <div className={styles.pagina}>
      <div className={entrada.bloco}>
        <CabecalhoPagina
          titulo="Soluções"
          descricao="O que implementar, com o passo a passo de quem já implementou. Você escolhe uma, segue as etapas e termina com algo rodando."
          acao={<ContadorCatalogo total={solucoes.length} rotulo="soluções publicadas" />}
        />
      </div>

      <div className={`${entrada.bloco} ${entrada.atraso1}`}>
        <CatalogoSolucoes
          solucoes={solucoes}
          icones={ICONES_CATEGORIAS}
          iconePadrao={ICONE_CATEGORIA_PADRAO}
          filtrosIniciais={lerFiltrosIniciais(params)}
        />
      </div>
    </div>
  );
}
