import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogoProjetos } from '@/app/(app)/solucoes/_components/CatalogoProjetos';
import { projetosPreview } from './fixture';
import { ProgressoPreview } from '../ProgressoPreview';
import CarregandoSolucoes from '@/app/(app)/solucoes/loading';
import styles from './preview.module.css';

export const metadata: Metadata = { title: 'Preview · Projetos' };

export default async function PreviewProjetosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { estado } = await searchParams;
  const etapas =
    estado === 'concluido'
      ? projetosPreview.flatMap((item) => item.etapaIds)
      : estado === 'andamento'
        ? projetosPreview[0]!.etapaIds.slice(0, 2)
        : [];

  return (
    <main className={styles.pagina}>
      <div className={styles.conteudo}>
        <ProgressoPreview etapas={etapas}>
          {estado === 'carregando' ? (
            <CarregandoSolucoes />
          ) : (
            <CatalogoProjetos solucoes={estado === 'vazio' ? [] : projetosPreview} />
          )}
        </ProgressoPreview>
      </div>
    </main>
  );
}
