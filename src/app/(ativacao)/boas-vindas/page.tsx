import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ROTA_ENTRAR } from '@/lib/routes';
import { concluiuIntroducaoSubido } from '@/lib/auth/introducao';
import { ExperienciaBoasVindas } from './ExperienciaBoasVindas';

export const metadata: Metadata = {
  title: 'Comece por aqui',
  description: 'A introdução para começar a vender e entregar projetos de IA com a Subido.',
};

const VIDEO_BOAS_VINDAS = process.env.NEXT_PUBLIC_VIDEO_BOAS_VINDAS_URL?.trim() || null;

export default async function BoasVindasPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data) redirect(ROTA_ENTRAR);

  const metadata = data.claims.user_metadata;
  if (concluiuIntroducaoSubido(metadata)) {
    redirect('/inicio');
  }

  const nome =
    typeof metadata?.nome === 'string' ? (metadata.nome.trim().split(/\s+/)[0] ?? null) : null;

  return <ExperienciaBoasVindas nome={nome} videoUrl={VIDEO_BOAS_VINDAS} />;
}
