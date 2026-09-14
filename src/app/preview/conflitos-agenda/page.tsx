import { notFound } from 'next/navigation';
import { ConflitosPreview } from './ConflitosPreview';

export default async function PreviewConflitos({
  searchParams,
}: PageProps<'/preview/conflitos-agenda'>) {
  if (process.env.NODE_ENV === 'production') notFound();
  const params = await searchParams;
  return (
    <ConflitosPreview reagendar={params.modo === 'reagendar'} varios={params.varios === '1'} />
  );
}
