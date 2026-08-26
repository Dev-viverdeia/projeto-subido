import 'server-only';

// Consulta administrativa protegida pelo layout e pela service role.
// eslint-disable-next-line no-restricted-imports
import { createAdminClient } from '@/lib/supabase/admin';
import type { OperacaoJob, StatusOperacao, TipoOperacao } from '@/lib/operacoes/tipos';

export type FiltroOperacoes = {
  status?: StatusOperacao;
  tipo?: TipoOperacao;
};

export async function obterPainelOperacoes(filtros: FiltroOperacoes = {}) {
  const admin = createAdminClient();
  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  let consulta = admin
    .from('operacoes_jobs')
    .select('*')
    .order('criado_em', { ascending: false })
    .limit(60);
  if (filtros.status) consulta = consulta.eq('status', filtros.status);
  if (filtros.tipo) consulta = consulta.eq('tipo', filtros.tipo);

  const [lista, emAndamento, falhas, concluidas, retomadas] = await Promise.all([
    consulta,
    admin
      .from('operacoes_jobs')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pendente', 'processando']),
    admin
      .from('operacoes_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'falhou')
      .gte('atualizado_em', desde),
    admin
      .from('operacoes_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'concluida')
      .gte('concluido_em', desde),
    admin
      .from('operacoes_jobs')
      .select('*', { count: 'exact', head: true })
      .gt('tentativas', 1)
      .gte('atualizado_em', desde),
  ]);

  if (lista.error) throw lista.error;
  const operacoes: OperacaoJob[] = lista.data ?? [];
  const donos = [...new Set(operacoes.map((item) => item.dono))];
  const contas = donos.length
    ? await admin.from('admin_contas').select('usuario_id, nome, email').in('usuario_id', donos)
    : { data: [], error: null };
  if (contas.error) console.error('[admin:operacoes:contas]', contas.error.message);

  const porDono = new Map(
    (contas.data ?? []).map((conta) => [
      conta.usuario_id,
      conta.nome || conta.email || 'Conta sem nome',
    ]),
  );

  return {
    operacoes: operacoes.map((item) => ({
      ...item,
      conta: porDono.get(item.dono) ?? 'Conta não identificada',
    })),
    resumo: {
      emAndamento: emAndamento.count ?? 0,
      falhas24h: falhas.count ?? 0,
      concluidas24h: concluidas.count ?? 0,
      retomadas24h: retomadas.count ?? 0,
    },
  };
}
