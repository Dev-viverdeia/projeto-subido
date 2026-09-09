import { notFound } from 'next/navigation';
import { equipeSuporte } from '@/lib/suporte/servidor';
export default async function EquipeSuporteLayout({ children }: { children: React.ReactNode }) {
  if (!(await equipeSuporte())) notFound();
  return children;
}
