import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { obterPortalCliente } from '@/lib/portal-cliente/servico';
import { PortalProjeto } from './PortalProjeto';

export const metadata: Metadata = {
  title: 'Acompanhamento do projeto',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function PortalClientePage({ params }: PageProps<'/portal/[codigo]'>) {
  const { codigo } = await params;
  const projeto = await obterPortalCliente(codigo);
  if (!projeto) notFound();

  return <PortalProjeto codigo={codigo} projeto={projeto} />;
}
