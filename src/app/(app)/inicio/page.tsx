import { Suspense } from 'react';
import type { Metadata } from 'next';
import { obterFocoLeveDoCrm } from '@/lib/crm/queries';
import { obterJornadaOperacional } from '@/lib/jornada/queries';
import { listarAgenda } from '@/lib/mentorias/queries';
import { createClient } from '@/lib/supabase/server';
import { CarregandoDado } from './_components/CarregandoDado';
import { MapaJornada } from './_components/MapaJornada';
import { PrioridadeOperacionalCarregando } from './_components/PrioridadeOperacional';
import { PrioridadeSobralInicio } from './_components/PrioridadeSobralInicio';
import { SobralChatInicio, SobralChatInicioCarregando } from './_components/SobralChatInicio';

export const metadata: Metadata = { title: 'Início' };

async function ClienteEmFoco() {
  const foco = await obterFocoLeveDoCrm();
  return <>{foco?.empresa ?? 'Nenhum cliente em foco'}</>;
}

async function ContatoEmFoco() {
  const foco = await obterFocoLeveDoCrm();
  return <>{foco?.contato ?? 'Adicione seu primeiro contato em Vendas'}</>;
}

async function ProximaAcaoCrm() {
  const foco = await obterFocoLeveDoCrm();
  return <>{foco?.proximaAcao ?? 'Defina a próxima ação da venda'}</>;
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
 * A página apresenta o produto e organiza a próxima ação com base nos fatos já
 * persistidos. Não existe briefing obrigatório na Início: o usuário aprende a
 * plataforma usando os módulos reais.
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
      nome={primeiroNome}
      prioridade={
        <Suspense fallback={<PrioridadeOperacionalCarregando />}>
          <PrioridadeSobralInicio jornada={jornada} />
        </Suspense>
      }
      sobral={
        <Suspense fallback={<SobralChatInicioCarregando />}>
          <SobralChatInicio jornada={jornada} />
        </Suspense>
      }
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
      plano={jornada.plano}
    />
  );
}
