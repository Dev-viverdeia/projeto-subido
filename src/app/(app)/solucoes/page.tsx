import type { Metadata } from 'next';
import { listarSolucoes } from '@/lib/conteudo/queries';
import { listarProjetosExecucao } from '@/lib/projetos-execucao/queries';
import { CabecalhoPagina } from '../_components/CabecalhoPagina';
import entrada from '../_components/entrada.module.css';
import { CatalogoProjetos } from './_components/CatalogoProjetos';
import { ProjetosEmExecucao } from './_components/ProjetosEmExecucao';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'Projetos' };

export default async function SolucoesPage() {
  const [solucoes, projetosEmExecucao] = await Promise.all([
    listarSolucoes(),
    listarProjetosExecucao(),
  ]);

  return (
    <div className={styles.pagina}>
      <CabecalhoPagina titulo="Projetos" oculto />

      <ProjetosEmExecucao projetos={projetosEmExecucao} />

      <div className={entrada.bloco}>
        <CatalogoProjetos
          solucoes={solucoes}
          tituloComo={projetosEmExecucao.length ? 'h2' : 'h1'}
        />
      </div>
    </div>
  );
}
