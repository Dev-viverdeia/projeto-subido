import type { Metadata } from 'next';
import PreviewShellPage from '../shell/page';
export const metadata: Metadata = { title: 'Preview · Métricas' };
export default async function PreviewMetricasPage({
  searchParams,
}: PageProps<'/preview/metricas'>) {
  const { estado } = await searchParams;
  return (
    <PreviewShellPage
      searchParams={Promise.resolve({
        tela: 'metricas',
        estado: typeof estado === 'string' ? estado : undefined,
      })}
    />
  );
}
