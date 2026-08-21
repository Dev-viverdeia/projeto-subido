import { Suspense } from 'react';
import type { Metadata } from 'next';
import { listarAgenda } from '@/lib/mentorias/queries';
import { createClient } from '@/lib/supabase/server';
import { CarregandoDado } from './_components/CarregandoDado';
import { MapaJornada } from './_components/MapaJornada';

export const metadata: Metadata = { title: 'Início' };

async function ProximaMentoria() {
  const agenda = await listarAgenda();
  const agora = new Date();
  const proxima = agenda.find((sessao) => new Date(sessao.fimIso).getTime() > agora.getTime());
  return <>{proxima?.titulo ?? 'Mentoria de implementação'}</>;
}

/**
 * O início é um painel leve para retomar o trabalho.
 *
 * A página apresenta somente a próxima mentoria e os acessos às áreas. O
 * consultor tem uma superfície própria em /consultor.
 */
export default async function InicioPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  const claims = data?.claims;
  const metadata = (claims?.user_metadata ?? {}) as { nome?: string };
  const primeiroNome = metadata.nome?.trim().split(/\s+/)[0] ?? null;
  return (
    <MapaJornada
      nome={primeiroNome}
      proximaMentoria={
        <Suspense fallback={<CarregandoDado largura="18ch" />}>
          <ProximaMentoria />
        </Suspense>
      }
    />
  );
}
