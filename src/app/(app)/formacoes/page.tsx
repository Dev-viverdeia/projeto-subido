import type { Metadata } from 'next';
import { listarFormacoes } from '@/lib/conteudo/queries';
import { EvolucaoProfissional } from '../_components/EvolucaoProfissional';
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
      <div className={entrada.bloco}>
        <EvolucaoProfissional
          etapa="formacoes"
          titulo="Aprenda para entregar."
          descricao="Formações aplicadas ao trabalho real: domine a ferramenta, leve o método para um projeto e avance com o progresso salvo na sua conta."
        />
      </div>

      {/* A faixa de resumo vem ANTES da régua: ela responde "onde eu estou" e o
          filtro responde "o que eu procuro". Invertido, a pessoa escolheria um
          recorte antes de saber que tem algo pela metade. */}
      <div className={`${entrada.bloco} ${entrada.atraso1}`}>
        <ResumoFormacoes formacoes={formacoes} />
      </div>

      <div className={`${entrada.bloco} ${entrada.atraso2}`}>
        <CatalogoFormacoes formacoes={formacoes} filtrosIniciais={lerFiltrosIniciais(params)} />
      </div>
    </div>
  );
}
