import type { Metadata } from 'next';
import { obterPainelSobral } from '@/lib/consultor/queries';
import { obterFocoDoCrm } from '@/lib/crm/queries';
import { obterJornadaOperacional } from '@/lib/jornada/queries';
import { listarAgenda } from '@/lib/mentorias/queries';
import { createClient } from '@/lib/supabase/server';
import { ConfiguracaoJornada } from './_components/ConfiguracaoJornada';
import { MapaJornada } from './_components/MapaJornada';

export const metadata: Metadata = { title: 'Início' };

/**
 * O início agora é o sistema de orientação do profissional.
 *
 * As três escolhas declaradas entram pelo briefing. Todo o restante é derivado
 * de evidências persistidas nos módulos operacionais — nenhum check demonstrativo.
 */
export default async function InicioPage() {
  const supabase = await createClient();
  const [{ data }, jornada, agenda, focoCrm, painelSobral] = await Promise.all([
    supabase.auth.getClaims(),
    obterJornadaOperacional(),
    listarAgenda(),
    obterFocoDoCrm(),
    obterPainelSobral(),
  ]);

  const claims = data?.claims;
  const metadata = (claims?.user_metadata ?? {}) as { nome?: string };
  const primeiroNome = metadata.nome?.trim().split(/\s+/)[0] ?? null;
  const nomeCompleto = metadata.nome?.trim() || primeiroNome || 'Meu negócio de IA';
  const agora = new Date();
  const proximaMentoria = agenda.find(
    (sessao) => new Date(sessao.fimIso).getTime() > agora.getTime(),
  );

  return (
    <MapaJornada
      configuracao={<ConfiguracaoJornada perfil={jornada.perfil} projetos={jornada.projetos} />}
      nome={primeiroNome}
      espacoDeTrabalho={`${nomeCompleto} — Consultoria`}
      cliente={focoCrm?.empresa ?? 'Nenhum lead em foco'}
      contato={focoCrm?.contato ?? 'Adicione seu primeiro contato no CRM'}
      proximaAcao={focoCrm?.proximaAcao ?? null}
      proximaMentoria={proximaMentoria?.titulo ?? null}
      oferta={jornada.perfil?.projetoInicialTitulo ?? null}
      nicho={jornada.perfil?.nicho ?? null}
      diagnosticoSobral={painelSobral.plano.diagnostico}
      focoSobral={painelSobral.plano.foco}
      plano={jornada.plano}
    />
  );
}
