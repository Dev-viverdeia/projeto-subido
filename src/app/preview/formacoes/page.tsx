import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FormacoesVista } from '@/app/(app)/formacoes/_components/FormacoesVista';
import { FORMACOES_DEMO } from './fixture';
import styles from '../aprendizado.module.css';

export const metadata: Metadata = { title: 'Preview · Formações' };

export default function PreviewFormacoesPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <main className={styles.pagina}>
      <div className={styles.conteudo}>
        <FormacoesVista formacoes={FORMACOES_DEMO} />
      </div>
    </main>
  );
}
