import type { Metadata } from 'next';
import { listarSolucoesDoBuilder } from '@/lib/builder/queries';
import { listarAgenda } from '@/lib/mentorias/queries';
import { createClient } from '@/lib/supabase/server';
import { MapaJornada } from './_components/MapaJornada';

export const metadata: Metadata = { title: 'Início' };

/**
 * O início agora é o sistema de orientação do profissional.
 *
 * Dados que já existem (nome, projetos do Estúdio e mentorias) entram de verdade.
 * Cliente e contato ainda não têm entidade própria no banco atual; até o CRM
 * nascer, a interface fala isso com clareza em vez de inventar atividade.
 */
export default async function InicioPage() {
  const supabase = await createClient();
  const [{ data }, projetos, agenda] = await Promise.all([
    supabase.auth.getClaims(),
    listarSolucoesDoBuilder(),
    listarAgenda(),
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

  return (
    <MapaJornada
      nome={primeiroNome}
      espacoDeTrabalho={`${nomeCompleto} — Consultoria`}
      cliente={projetoAtual?.titulo ?? 'Seu primeiro projeto'}
      lead={projetoAtual?.titulo ?? 'Nenhum lead selecionado'}
      contato="Adicione um contato no CRM"
      proximaMentoria={proximaMentoria?.titulo ?? null}
    />
  );
}
