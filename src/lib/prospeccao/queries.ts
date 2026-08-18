import 'server-only';

import { handleError } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';
import { obterSaldoProspeccao } from './admin';

export async function carregarProspeccao(listaPreferida?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Sessão necessária para carregar a Prospecção.');

  const [saldo, listas] = await Promise.all([
    obterSaldoProspeccao(user.id),
    supabase
      .from('prospeccao_listas')
      .select(
        'id, nome, segmento, localizacao, termos, status, quantidade_solicitada, creditos_consumidos, provedores, erro, criado_em, concluido_em',
      )
      .order('criado_em', { ascending: false })
      .limit(30),
  ]);

  if (saldo.error) throw handleError(saldo.error, 'prospeccao:saldo');
  if (listas.error) throw handleError(listas.error, 'prospeccao:listas');

  const listaAtual =
    listas.data.find((lista) => lista.id === listaPreferida) ?? listas.data.at(0) ?? null;
  const leads = listaAtual
    ? await supabase
        .from('prospeccao_leads')
        .select(
          'id, nome, categoria, endereco, cidade, estado, site_url, dominio, telefone, telefones, emails, redes_sociais, decisores, horarios, maps_url, imagem_url, avaliacao, total_avaliacoes, descricao, fontes, qualificacao, dados, crm_oportunidade_id',
        )
        .eq('lista_id', listaAtual.id)
        .order('criado_em')
    : null;

  if (leads?.error) throw handleError(leads.error, 'prospeccao:leads');

  return {
    saldo: saldo.data,
    listas: listas.data,
    listaAtual,
    leads: leads?.data ?? [],
  };
}
