import 'server-only';

// Publicar resultados e estornar créditos são operações do sistema. Este módulo
// server-only mantém a service role fora dos componentes e das ações expostas.
// eslint-disable-next-line no-restricted-imports
import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/lib/supabase/types.generated';
import type { ResultadoProvedores } from './provedores';
import type { BuscaProspeccao } from './schema';

export async function obterSaldoProspeccao(dono: string) {
  return createAdminClient().rpc('prospeccao_sistema_obter_saldo', { p_dono: dono });
}

export async function reservarListaProspeccao(dono: string, nome: string, busca: BuscaProspeccao) {
  return createAdminClient().rpc('prospeccao_sistema_criar_lista', {
    p_dono: dono,
    p_nome: nome,
    p_segmento: busca.segmento,
    p_localizacao: busca.localizacao,
    p_termos: [],
    p_quantidade: busca.quantidade,
    p_filtros: {},
  });
}

export async function concluirListaProspeccao(
  dono: string,
  lista: string,
  resultado: ResultadoProvedores,
) {
  return createAdminClient().rpc('prospeccao_sistema_concluir_lista', {
    p_dono: dono,
    p_lista: lista,
    p_leads: resultado.leads as unknown as Json,
    p_provedores: resultado.provedores,
  });
}

export async function falharListaProspeccao(dono: string, lista: string, motivo?: string) {
  return createAdminClient().rpc('prospeccao_sistema_falhar_lista', {
    p_dono: dono,
    p_lista: lista,
    p_erro: motivo || 'Os provedores não concluíram esta busca.',
  });
}

export async function enviarLeadProspeccaoAoCrm(dono: string, lead: string) {
  const admin = createAdminClient();
  const resultado = await admin.rpc('prospeccao_sistema_enviar_lead_crm', {
    p_dono: dono,
    p_lead: lead,
  });
  if (!resultado.error && resultado.data) {
    await admin
      .from('prospeccao_leads')
      .update({ status_prospeccao: 'no_crm' })
      .eq('dono', dono)
      .eq('id', lead);
  }
  return resultado;
}
