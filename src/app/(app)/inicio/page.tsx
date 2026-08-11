import { Suspense } from 'react';
import type { Metadata } from 'next';
import { obterPainelSobral } from '@/lib/consultor/queries';
import { obterFocoDoCrm } from '@/lib/crm/queries';
import { obterJornadaOperacional } from '@/lib/jornada/queries';
import { listarAgenda } from '@/lib/mentorias/queries';
import { createClient } from '@/lib/supabase/server';
import { ConfiguracaoJornada } from './_components/ConfiguracaoJornada';
import { CarregandoDado } from './_components/CarregandoDado';
import { MapaJornada } from './_components/MapaJornada';

export const metadata: Metadata = { title: 'Início' };

async function DiagnosticoSobral() {
  const painel = await obterPainelSobral();
  return <>{painel.plano.diagnostico}</>;
}

async function FocoSobral() {
  const painel = await obterPainelSobral();
  return <>{painel.plano.foco}</>;
}

async function ClienteEmFoco() {
  const foco = await obterFocoDoCrm();
  return <>{foco?.empresa ?? 'Nenhum lead em foco'}</>;
}

async function ContatoEmFoco() {
  const foco = await obterFocoDoCrm();
  return <>{foco?.contato ?? 'Adicione seu primeiro contato no CRM'}</>;
}

async function ProximaAcaoCrm() {
  const foco = await obterFocoDoCrm();
  return <>{foco?.proximaAcao ?? 'Defina a próxima ação no CRM'}</>;
}

async function ProximaMentoria() {
  const agenda = await listarAgenda();
  const agora = new Date();
  const proxima = agenda.find((sessao) => new Date(sessao.fimIso).getTime() > agora.getTime());
  return <>{proxima?.titulo ?? 'Mentoria de implementação'}</>;
}

/**
 * O início agora é o sistema de orientação do profissional.
 *
 * As três escolhas declaradas entram pelo briefing. Todo o restante é derivado
 * de evidências persistidas nos módulos operacionais — nenhum check demonstrativo.
 */
export default async function InicioPage() {
  const supabase = await createClient();
  const [{ data }, jornada] = await Promise.all([
    supabase.auth.getClaims(),
    obterJornadaOperacional(),
  ]);

  const claims = data?.claims;
  const metadata = (claims?.user_metadata ?? {}) as { nome?: string };
  const primeiroNome = metadata.nome?.trim().split(/\s+/)[0] ?? null;
  return (
    <MapaJornada
      configuracao={<ConfiguracaoJornada perfil={jornada.perfil} projetos={jornada.projetos} />}
      nome={primeiroNome}
      cliente={
        <Suspense fallback={<CarregandoDado largura="16ch" />}>
          <ClienteEmFoco />
        </Suspense>
      }
      contato={
        <Suspense fallback={<CarregandoDado largura="12ch" />}>
          <ContatoEmFoco />
        </Suspense>
      }
      proximaAcao={
        <Suspense fallback={<CarregandoDado largura="20ch" />}>
          <ProximaAcaoCrm />
        </Suspense>
      }
      proximaMentoria={
        <Suspense fallback={<CarregandoDado largura="18ch" />}>
          <ProximaMentoria />
        </Suspense>
      }
      diagnosticoSobral={
        <Suspense fallback={<CarregandoDado largura="24ch" />}>
          <DiagnosticoSobral />
        </Suspense>
      }
      focoSobral={
        <Suspense fallback={<CarregandoDado largura="22ch" />}>
          <FocoSobral />
        </Suspense>
      }
      plano={jornada.plano}
    />
  );
}
