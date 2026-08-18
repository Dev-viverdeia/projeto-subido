import 'server-only';

// eslint-disable-next-line no-restricted-imports
import { createAdminClient } from '@/lib/supabase/admin';
import type { LeadProspeccaoEntrada } from './schema';

export type MemoriaProspeccao = {
  chaves: Set<string>;
  dominios: Set<string>;
  identidades: Set<string>;
};

export type ExposicaoProspeccao = {
  total: number;
  recentes: number;
};

function normalizar(valor: string | null | undefined) {
  return (valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function dominioNormalizado(valor: string | null | undefined) {
  return (valor ?? '')
    .replace(/^www\./, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
}

export function identidadeDaEmpresa(
  empresa: Pick<LeadProspeccaoEntrada, 'nome' | 'cidade' | 'estado' | 'endereco'>,
) {
  const local = normalizar(
    [empresa.cidade, empresa.estado].filter(Boolean).join(' ') || empresa.endereco,
  );
  return `${normalizar(empresa.nome)}|${local}`;
}

export async function carregarMemoriaProspeccao(dono: string): Promise<MemoriaProspeccao> {
  const admin = createAdminClient();
  const [historico, empresasCrm] = await Promise.all([
    admin
      .from('prospeccao_leads')
      .select('chave_externa, dominio, nome, cidade, estado, endereco')
      .eq('dono', dono)
      .limit(10_000),
    admin
      .from('crm_empresas')
      .select('dominio, nome, cidade, estado')
      .eq('dono', dono)
      .limit(10_000),
  ]);

  if (historico.error) throw historico.error;
  if (empresasCrm.error) throw empresasCrm.error;

  const chaves = new Set(historico.data.map((lead) => lead.chave_externa));
  const dominios = new Set(
    [...historico.data, ...empresasCrm.data]
      .map((empresa) => dominioNormalizado(empresa.dominio))
      .filter(Boolean),
  );
  const identidades = new Set([
    ...historico.data.map(identidadeDaEmpresa),
    ...empresasCrm.data.map((empresa) => identidadeDaEmpresa({ ...empresa, endereco: null })),
  ]);

  return { chaves, dominios, identidades };
}

export async function carregarExposicoesProspeccao(chaves: string[]) {
  const unicas = [...new Set(chaves)].slice(0, 200);
  const exposicoes = new Map<string, ExposicaoProspeccao>();
  if (!unicas.length) return exposicoes;

  const { data, error } = await createAdminClient()
    .from('prospeccao_leads')
    .select('chave_externa, criado_em')
    .in('chave_externa', unicas)
    .limit(20_000);
  if (error) throw error;

  const limiteRecente = Date.now() - 30 * 24 * 60 * 60 * 1000;
  for (const lead of data) {
    const atual = exposicoes.get(lead.chave_externa) ?? { total: 0, recentes: 0 };
    atual.total += 1;
    if (new Date(lead.criado_em).getTime() >= limiteRecente) atual.recentes += 1;
    exposicoes.set(lead.chave_externa, atual);
  }
  return exposicoes;
}
