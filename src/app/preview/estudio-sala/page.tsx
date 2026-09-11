import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EntenderProjeto } from '@/app/(app)/builder/_components/sala/EntenderProjeto';
import { EstudioPreview } from './EstudioPreview';
import { projetoEstudioPreview } from './fixture';
import styles from './preview.module.css';

export const metadata: Metadata = { title: 'Preview · Sala do Estúdio' };

export default async function PreviewSalaEstudioPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { estado } = await searchParams;
  return (
    <main className={styles.pagina}>
      <EstudioPreview
        estado={estado}
        entender={<EntenderProjeto documento={projetoEstudioPreview.documento!} />}
      />
    </main>
  );
}
