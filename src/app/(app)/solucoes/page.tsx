import type { Metadata } from 'next';
import { listarSolucoes } from '@/lib/conteudo/queries';
import entrada from '../_components/entrada.module.css';
import { CatalogoProjetos } from './_components/CatalogoProjetos';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'Projetos' };

export default async function SolucoesPage() {
  const solucoes = await listarSolucoes();

  return (
    <div className={styles.pagina}>
      <div className={entrada.bloco}>
        <CatalogoProjetos solucoes={solucoes} />
      </div>
    </div>
  );
}
