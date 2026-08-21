import { Suspense } from 'react';
import type { Metadata } from 'next';
import { obterFocoLeveDoCrm } from '@/lib/crm/queries';
import { listarAgenda } from '@/lib/mentorias/queries';
import { createClient } from '@/lib/supabase/server';
import { CarregandoDado } from './_components/CarregandoDado';
import { MapaJornada } from './_components/MapaJornada';

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
 * O início é um painel leve para retomar o trabalho.
 *
 * A página apresenta somente o que ajuda o usuário a continuar: mentoria,
 * oportunidade em foco e acessos às áreas. O consultor tem uma superfície
 * própria em /consultor.
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
    />
  );
}
