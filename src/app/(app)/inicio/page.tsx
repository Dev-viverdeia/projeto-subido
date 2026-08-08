import type { Metadata } from 'next';
import { listarSolucoesDoBuilder } from '@/lib/builder/queries';
import { obterPainelSobral } from '@/lib/consultor/queries';
import { obterFocoDoCrm } from '@/lib/crm/queries';
import { listarAgenda } from '@/lib/mentorias/queries';
import { createClient } from '@/lib/supabase/server';
import { MapaJornada } from './_components/MapaJornada';

export const metadata: Metadata = { title: 'Início' };

/**
 * O início agora é o sistema de orientação do profissional.
 *
 * Nome, CRM, projetos do Estúdio e mentorias entram de verdade. O marco inicial
 * acompanha a etapa da oportunidade em foco — o mapa agora orienta pelo estado
 * operacional, não por uma demonstração fixa.
 */
export default async function InicioPage() {
  const supabase = await createClient();
  const [{ data }, projetos, agenda, focoCrm, painelSobral] = await Promise.all([
    supabase.auth.getClaims(),
    listarSolucoesDoBuilder(),
    listarAgenda(),
    obterFocoDoCrm(),
    obterPainelSobral(),
  ]);

  const claims = data?.claims;
  const metadata = (claims?.user_metadata ?? {}) as { nome?: string };
  const primeiroNome = metadata.nome?.trim().split(/\s+/)[0] ?? null;
  const nomeCompleto = metadata.nome?.trim() || primeiroNome || 'Meu negócio de IA';
  const projetoAtual = projetos[0];
  const agora = new Date();
  const proximaMentoria = agenda.find(
    (sessao) => new Date(sessao.fimIso).getTime() > agora.getTime(),
  );
  const etapaInicial = painelSobral.plano.etapa;

  return (
    <MapaJornada
      nome={primeiroNome}
      espacoDeTrabalho={`${nomeCompleto} — Consultoria`}
      cliente={focoCrm?.empresa ?? projetoAtual?.titulo ?? 'Sua operação'}
      lead={focoCrm?.titulo ?? 'Nenhum lead selecionado'}
      contato={focoCrm?.contato ?? 'Adicione seu primeiro contato no CRM'}
      proximaAcao={focoCrm?.proximaAcao ?? null}
      etapaInicial={etapaInicial}
      proximaMentoria={proximaMentoria?.titulo ?? null}
    />
  );
}
