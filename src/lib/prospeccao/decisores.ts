import 'server-only';

import type { LeadProspeccaoEntrada } from './schema';
import {
  comoRegistro,
  inteiro,
  jsonDaResposta,
  qualificar,
  texto,
  urlPublica,
  type Registro,
} from './normalizacao';

type Decisor = LeadProspeccaoEntrada['decisores'][number];
const SENIORIDADES = ['Owner', 'Founder', 'C-level', 'Partner', 'VP', 'Head', 'Director'];
const PRIORIDADES = new Map(SENIORIDADES.map((item, indice) => [item.toLowerCase(), indice]));
const DOMINIOS_SOCIAIS = new Set([
  'facebook.com',
  'instagram.com',
  'linkedin.com',
  'linktr.ee',
  'tiktok.com',
  'youtube.com',
]);

function decisorDaPessoa(valor: unknown): { decisor: Decisor; empresa: Registro | null } | null {
  const pessoa = comoRegistro(valor);
  const emprego = comoRegistro(comoRegistro(pessoa?.employment)?.current);
  const empresa = comoRegistro(emprego?.company);
  const perfil = comoRegistro(comoRegistro(pessoa?.social_profiles)?.professional_network);
  const localizacao = comoRegistro(pessoa?.location);
  const nome = texto(pessoa?.full_name);
  if (!nome) return null;
  return {
    decisor: {
      nome,
      cargo: texto(emprego?.title) ?? texto(pessoa?.headline),
      senioridade: texto(emprego?.seniority),
      linkedin_url: urlPublica(perfil?.url),
      localizacao:
        [texto(localizacao?.city), texto(localizacao?.region), texto(localizacao?.country)]
          .filter(Boolean)
          .join(', ') || null,
      email: null,
      telefone: null,
      fonte: 'FullEnrich · perfil profissional público',
    },
    empresa,
  };
}

function prioridade(decisor: Decisor) {
  return PRIORIDADES.get(decisor.senioridade?.toLowerCase() ?? '') ?? SENIORIDADES.length;
}

export async function buscarDecisores(
  lead: LeadProspeccaoEntrada,
  chave: string,
): Promise<{ lead: LeadProspeccaoEntrada; sucesso: boolean; consultado: boolean }> {
  const dominio = lead.dominio?.replace(/^www\./, '').toLowerCase() ?? null;
  const filtroEmpresa =
    dominio && !DOMINIOS_SOCIAIS.has(dominio)
      ? { current_company_domains: [{ value: dominio, exact_match: true, exclude: false }] }
      : { current_company_names: [{ value: lead.nome, exact_match: true, exclude: false }] };

  try {
    const resposta = await fetch('https://app.fullenrich.com/api/v2/people/search', {
      method: 'POST',
      headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        limit: 5,
        ...filtroEmpresa,
        current_position_seniority_level: SENIORIDADES.map((value) => ({
          value,
          exact_match: true,
          exclude: false,
        })),
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
    const json = (await jsonDaResposta(resposta)) as Registro;
    const pessoas = Array.isArray(json.people) ? json.people : [];
    const encontrados = pessoas
      .map(decisorDaPessoa)
      .filter((item): item is NonNullable<ReturnType<typeof decisorDaPessoa>> => Boolean(item))
      .sort((a, b) => prioridade(a.decisor) - prioridade(b.decisor));
    const decisores = encontrados
      .map((item) => item.decisor)
      .filter(
        (decisor, indice, todos) =>
          todos.findIndex(
            (item) =>
              item.linkedin_url === decisor.linkedin_url ||
              item.nome.toLocaleLowerCase('pt-BR') === decisor.nome.toLocaleLowerCase('pt-BR'),
          ) === indice,
      )
      .slice(0, 5);
    const empresa = encontrados[0]?.empresa;
    const atualizado: LeadProspeccaoEntrada = {
      ...lead,
      decisores,
      fontes: decisores.length
        ? [...new Set([...lead.fontes, 'FullEnrich · dados profissionais públicos'])]
        : lead.fontes,
      dados: {
        ...lead.dados,
        empresa_profissional: empresa
          ? {
              setor: texto(empresa.industry),
              porte: empresa.headcount_range ?? empresa.headcount ?? null,
              ano_fundacao: inteiro(empresa.year_founded),
              descricao: texto(empresa.description),
            }
          : null,
      },
      qualificacao: lead.qualificacao,
    };
    return {
      lead: { ...atualizado, qualificacao: qualificar(atualizado) },
      sucesso: true,
      consultado: true,
    };
  } catch {
    return { lead, sucesso: false, consultado: true };
  }
}
