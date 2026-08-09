import { Suspense } from 'react';
import type { Metadata } from 'next';
import { obterPainelSobral } from '@/lib/consultor/queries';
import { obterFocoDoCrm } from '@/lib/crm/queries';
import { obterJornadaOperacional } from '@/lib/jornada/queries';
import { listarAgenda } from '@/lib/mentorias/queries';
import { createClient } from '@/lib/supabase/server';
import { ConfiguracaoJornada } from './_components/ConfiguracaoJornada';
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
  const nomeCompleto = metadata.nome?.trim() || primeiroNome || 'Meu negócio de IA';
  return (
    <MapaJornada
      configuracao={<ConfiguracaoJornada perfil={jornada.perfil} projetos={jornada.projetos} />}
      nome={primeiroNome}
      espacoDeTrabalho={`${nomeCompleto} — Consultoria`}
      cliente={
        <Suspense fallback={<span>Carregando lead em foco…</span>}>
          <ClienteEmFoco />
        </Suspense>
      }
      contato={
        <Suspense fallback={<span>Carregando contato…</span>}>
          <ContatoEmFoco />
        </Suspense>
      }
      proximaAcao={
        <Suspense fallback={<span>Carregando próxima ação…</span>}>
          <ProximaAcaoCrm />
        </Suspense>
      }
      proximaMentoria={
        <Suspense fallback={<span>Carregando próximo encontro…</span>}>
          <ProximaMentoria />
        </Suspense>
      }
      oferta={jornada.perfil?.projetoInicialTitulo ?? null}
      nicho={jornada.perfil?.nicho ?? null}
      diagnosticoSobral={
        <Suspense fallback={<span>Lendo os sinais da operação…</span>}>
          <DiagnosticoSobral />
        </Suspense>
      }
      focoSobral={
        <Suspense fallback={<span>Definindo a prioridade…</span>}>
          <FocoSobral />
        </Suspense>
      }
      plano={jornada.plano}
    />
  );
}
