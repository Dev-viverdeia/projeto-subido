import { notFound } from 'next/navigation';
import '@livekit/components-styles';
import { RetomadaPreview } from './RetomadaPreview';

/** Transportes sintéticos e nenhuma chamada a dados, captura ou salas reais. */
export default async function PreviewRetomada({
  searchParams,
}: PageProps<'/preview/retomada-reuniao'>) {
  if (process.env.NODE_ENV === 'production') notFound();
  const params = await searchParams;
  return <RetomadaPreview convidado={params.papel !== 'anfitriao'} />;
}
