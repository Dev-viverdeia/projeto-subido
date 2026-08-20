import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ExperienciaBoasVindas } from '@/app/(ativacao)/boas-vindas/ExperienciaBoasVindas';

export const metadata: Metadata = { title: 'Preview · Boas-vindas' };

export default function PreviewBoasVindasPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <ExperienciaBoasVindas nome="Mateus" videoUrl={null} />;
}
