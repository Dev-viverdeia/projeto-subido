import { notFound } from 'next/navigation';
import '@livekit/components-styles';
import { SalaDispositivosPreview } from './SalaDispositivosPreview';

export default function PreviewSalaDispositivos() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <SalaDispositivosPreview />;
}
