import 'server-only';

// eslint-disable-next-line no-restricted-imports -- modulo server-only da administracao
import { createAdminClient } from '@/lib/supabase/admin';
import { planoDosMetadados, type PlanoSubido } from '@/lib/planos/acessos';

export type ContaAdministrada = {
  id: string;
  email: string | null;
  nome: string | null;
  plano: PlanoSubido;
  saldo: number;
  ultimoAcessoEm: string | null;
  criadaEm: string;
};

export type EventoAcessoAdmin = {
  id: string;
  usuarioId: string;
  tipo: 'plano_alterado' | 'pacote_concedido';
  planoAnterior: PlanoSubido | null;
  planoNovo: PlanoSubido | null;
  pacoteId: string | null;
  creditos: number | null;
  saldoApos: number | null;
  criadoEm: string;
};

export type ListaContasAdmin = {
  contas: ContaAdministrada[];
  eventos: EventoAcessoAdmin[];
  total: number;
  pagina: number;
  paginas: number;
};

const POR_PAGINA = 24;

/**
 * Busca administrativa paginada.
 *
 * A RPC e o cliente de sistema ficam exclusivamente no servidor. O navegador
 * recebe somente os campos que a tela realmente usa, nunca o objeto completo
 * de Auth nem metadados internos da conta.
 */
export async function listarContasAdmin({
  busca,
  pagina,
}: {
  busca?: string;
  pagina?: number;
}): Promise<ListaContasAdmin> {
  const paginaSegura = Math.max(1, Number.isFinite(pagina) ? Math.trunc(pagina ?? 1) : 1);
  const termo = busca?.trim().slice(0, 160) || null;
  const admin = createAdminClient();

  const { data, error } = await admin.rpc('admin_sistema_listar_contas', {
    p_busca: termo ?? undefined,
    p_limite: POR_PAGINA,
    p_offset: (paginaSegura - 1) * POR_PAGINA,
  });

  if (error) {
    console.error('[admin:acessos:listar]', error.code, error.message);
    return { contas: [], eventos: [], total: 0, pagina: paginaSegura, paginas: 1 };
  }

  const contas = (data ?? []).map((conta) => ({
    id: conta.usuario_id,
    email: conta.email || null,
    nome: conta.nome || null,
    plano: planoDosMetadados({ plano_subido: conta.plano }),
    saldo: conta.saldo,
    ultimoAcessoEm: conta.ultimo_acesso_em || null,
    criadaEm: conta.criado_em,
  }));
  const total = Number(data?.[0]?.total ?? 0);
  const ids = contas.map((conta) => conta.id);

  if (ids.length === 0) {
    return {
      contas,
      eventos: [],
      total,
      pagina: paginaSegura,
      paginas: Math.max(1, Math.ceil(total / POR_PAGINA)),
    };
  }

  const { data: eventosBrutos, error: erroEventos } = await admin
    .from('admin_acessos_eventos')
    .select(
      'id, usuario_id, tipo, plano_anterior, plano_novo, pacote_id, creditos, saldo_apos, criado_em',
    )
    .in('usuario_id', ids)
    .order('criado_em', { ascending: false })
    .limit(ids.length * 8);

  if (erroEventos) {
    console.error('[admin:acessos:eventos]', erroEventos.code, erroEventos.message);
  }

  const eventos = (eventosBrutos ?? []).map((evento) => ({
    id: evento.id,
    usuarioId: evento.usuario_id,
    tipo: evento.tipo as EventoAcessoAdmin['tipo'],
    planoAnterior: evento.plano_anterior
      ? planoDosMetadados({ plano_subido: evento.plano_anterior })
      : null,
    planoNovo: evento.plano_novo ? planoDosMetadados({ plano_subido: evento.plano_novo }) : null,
    pacoteId: evento.pacote_id,
    creditos: evento.creditos,
    saldoApos: evento.saldo_apos,
    criadoEm: evento.criado_em,
  }));

  return {
    contas,
    eventos,
    total,
    pagina: paginaSegura,
    paginas: Math.max(1, Math.ceil(total / POR_PAGINA)),
  };
}
