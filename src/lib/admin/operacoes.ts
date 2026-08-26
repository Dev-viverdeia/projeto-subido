import 'server-only';

// Consulta administrativa protegida pelo layout e pela service role.
// eslint-disable-next-line no-restricted-imports
import { createAdminClient } from '@/lib/supabase/admin';
import { avaliarSaudeOperacional } from '@/lib/operacoes/saude';
import type { OperacaoJob, StatusOperacao, TipoOperacao } from '@/lib/operacoes/tipos';

export type FiltroOperacoes = {
  status?: StatusOperacao;
  tipo?: TipoOperacao;
};

export async function obterPainelOperacoes(filtros: FiltroOperacoes = {}) {
  const admin = createAdminClient();

  let consulta = admin
    .from('operacoes_jobs')
    .select('*')
    .order('criado_em', { ascending: false })
    .limit(60);
  if (filtros.status) consulta = consulta.eq('status', filtros.status);
  if (filtros.tipo) consulta = consulta.eq('tipo', filtros.tipo);

  const [lista, resumoOperacional] = await Promise.all([
    consulta,
    admin.rpc('operacoes_sistema_resumo', { p_janela_horas: 24 }).single(),
  ]);

  if (lista.error) throw lista.error;
  if (resumoOperacional.error) throw resumoOperacional.error;
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

  const resumo = resumoOperacional.data;
  return {
    operacoes: operacoes.map((item) => ({
      ...item,
      conta: porDono.get(item.dono) ?? 'Conta não identificada',
    })),
    resumo,
    saude: avaliarSaudeOperacional(resumo),
  };
}
