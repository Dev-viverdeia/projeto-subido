import { Suspense } from 'react';
import type { Metadata } from 'next';
import { obterJornadaOperacional } from '@/lib/jornada/queries';
import { listarAgenda } from '@/lib/mentorias/queries';
import { planoDosMetadados } from '@/lib/planos/acessos';
import { createClient } from '@/lib/supabase/server';
import { CarregandoDado } from './_components/CarregandoDado';
import { MapaJornada } from './_components/MapaJornada';
import { PrioridadeOperacionalCarregando } from './_components/PrioridadeOperacional';
import { PrioridadeSobralInicio } from './_components/PrioridadeSobralInicio';

export const metadata: Metadata = { title: 'Início' };

async function ProximaMentoria() {
  const agenda = await listarAgenda();
  const agora = new Date();
  const proxima = agenda.find((sessao) => new Date(sessao.fimIso).getTime() > agora.getTime());
  return <>{proxima?.titulo ?? 'Ver próximos encontros'}</>;
}

/**
 * O início apresenta uma única direção para retomar o trabalho.
 *
 * Os módulos continuam disponíveis na navegação. A página cruza os fatos já
 * registrados para apontar somente a ação que merece atenção agora.
 */
export default async function InicioPage() {
  const supabase = await createClient();
  const [{ data }, jornada] = await Promise.all([
    supabase.auth.getClaims(),
    obterJornadaOperacional(),
  ]);

  const claims = data?.claims;
  const metadata = (claims?.user_metadata ?? {}) as { nome?: string };
  const plano = planoDosMetadados(claims?.app_metadata);
  const primeiroNome = metadata.nome?.trim().split(/\s+/)[0] ?? null;
  return (
    <MapaJornada
      nome={primeiroNome}
      plano={jornada.plano}
      prioridade={
        <Suspense fallback={<PrioridadeOperacionalCarregando />}>
          <PrioridadeSobralInicio jornada={jornada} plano={plano} />
        </Suspense>
      }
      proximaMentoria={
        <Suspense fallback={<CarregandoDado largura="18ch" />}>
          <ProximaMentoria />
        </Suspense>
      }
    />
  );
}
