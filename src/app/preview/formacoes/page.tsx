import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FormacoesVista } from '@/app/(app)/formacoes/_components/FormacoesVista';
import { FORMACOES_DEMO } from './fixture';
import { ProgressoPreview } from '../ProgressoPreview';
import CarregandoFormacoes from '@/app/(app)/formacoes/loading';
import styles from '../aprendizado.module.css';

export const metadata: Metadata = { title: 'Preview · Formações' };

export default async function PreviewFormacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { estado } = await searchParams;
  const aulas =
    estado === 'concluido'
      ? FORMACOES_DEMO.flatMap((item) => item.aulaIds)
      : estado === 'andamento'
        ? FORMACOES_DEMO[0]!.aulaIds.slice(0, 2)
        : [];

  return (
    <main className={styles.pagina}>
      <div className={styles.conteudo}>
        <ProgressoPreview aulas={aulas}>
          {estado === 'carregando' ? (
            <CarregandoFormacoes />
          ) : (
            <FormacoesVista formacoes={estado === 'vazio' ? [] : FORMACOES_DEMO} />
          )}
        </ProgressoPreview>
      </div>
    </main>
  );
}
