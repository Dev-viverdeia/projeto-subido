import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogoProjetos } from '@/app/(app)/solucoes/_components/CatalogoProjetos';
import { projetosPreview } from './fixture';
import styles from './preview.module.css';

export const metadata: Metadata = { title: 'Preview · Projetos' };

export default function PreviewProjetosPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <main className={styles.pagina}>
      <div className={styles.conteudo}>
        <CatalogoProjetos solucoes={projetosPreview} />
      </div>
    </main>
  );
}
