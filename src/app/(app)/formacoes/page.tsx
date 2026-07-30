import type { Metadata } from 'next';
import { listarFormacoes } from '@/lib/conteudo/queries';
import { CabecalhoPagina } from '../_components/CabecalhoPagina';
import { lerFiltrosIniciais } from '../_components/filtros/urlFiltros';
import entrada from '../_components/entrada.module.css';
import { CatalogoFormacoes } from './_components/CatalogoFormacoes';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'Formações' };

export default async function FormacoesPage({ searchParams }: PageProps<'/formacoes'>) {
  const [formacoes, params] = await Promise.all([listarFormacoes(), searchParams]);

  return (
    <div className={styles.pagina}>
      <CabecalhoPagina titulo="Formações" oculto />

      <section
        className={`${entrada.bloco} ${styles.apresentacao}`}
        aria-labelledby="formacoes-titulo"
      >
        <div className={styles.apresentacaoTexto}>
          <p className={styles.marcador}>Biblioteca de formações</p>
          <h2 className={styles.tituloPagina} id="formacoes-titulo">
            Aprenda a implementar, etapa por etapa.
          </h2>
          <p className={styles.descricaoPagina}>
            Escolha uma trilha e avance por módulos e aulas organizados para aplicar o conteúdo em
            projetos reais.
          </p>
        </div>
        <div className={styles.placar} aria-label={`${formacoes.length} formações publicadas`}>
          <strong>{formacoes.length}</strong>
          <span>{formacoes.length === 1 ? 'formação publicada' : 'formações publicadas'}</span>
        </div>
      </section>

      <div className={`${entrada.bloco} ${entrada.atraso1}`}>
        <CatalogoFormacoes formacoes={formacoes} filtrosIniciais={lerFiltrosIniciais(params)} />
      </div>
    </div>
  );
}
