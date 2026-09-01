import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CursoConteudo } from '@/app/(app)/formacoes/_components/CursoConteudo';
import { FORMACAO_DEMO } from '../formacoes/fixture';
import styles from '../aprendizado.module.css';

export const metadata: Metadata = { title: 'Preview · Formação' };

export default function PreviewFormacaoPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <main className={styles.pagina}>
      <div className={styles.conteudo}>
        <CursoConteudo formacao={FORMACAO_DEMO} />
      </div>
    </main>
  );
}
