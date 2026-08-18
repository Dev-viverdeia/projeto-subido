import 'server-only';

import { env } from '@/lib/env';
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

function primeiroTexto(...valores: unknown[]) {
  for (const valor of valores) {
    const direto = texto(valor);
    if (direto) return direto;
    if (Array.isArray(valor)) {
      for (const item of valor) {
        const registro = comoRegistro(item);
        const encontrado = texto(registro?.email) ?? texto(registro?.number) ?? texto(item);
        if (encontrado) return encontrado;
      }
    }
  }
  return null;
}

function decisorDaPessoa(valor: unknown): { decisor: Decisor; empresa: Registro | null } | null {
  const pessoa = comoRegistro(valor);
  const emprego = comoRegistro(comoRegistro(pessoa?.employment)?.current);
  const empresa = comoRegistro(emprego?.company);
  const perfil = comoRegistro(comoRegistro(pessoa?.social_profiles)?.professional_network);
  const contato = comoRegistro(pessoa?.contact_info);
  const emailProvavel = comoRegistro(contato?.most_probable_work_email);
  const telefoneProvavel = comoRegistro(contato?.most_probable_phone);
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
      email: primeiroTexto(
        emailProvavel?.email,
        pessoa?.work_email,
        pessoa?.email,
        contato?.work_emails,
      ),
      telefone: primeiroTexto(
        telefoneProvavel?.number,
        pessoa?.phone,
        pessoa?.mobile_phone,
        contato?.phones,
      ),
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
    const decisores = [...encontrados.map((item) => item.decisor), ...lead.decisores]
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

function nomeSeparado(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return {
    primeiro: partes[0] ?? nome,
    ultimo: partes.slice(1).join(' ') || partes[0] || nome,
  };
}

export async function iniciarEnriquecimentoDeContatos({
  leads,
  chave,
  segredo,
  dono,
  lista,
}: {
  leads: LeadProspeccaoEntrada[];
  chave: string;
  segredo: string;
  dono: string;
  lista: string;
}): Promise<{ leads: LeadProspeccaoEntrada[]; iniciado: boolean }> {
  const dados = leads.flatMap((lead) => {
    const decisor = lead.decisores[0];
    if (!decisor || (!decisor.linkedin_url && !lead.dominio)) return [];
    const nome = nomeSeparado(decisor.nome);
    return [
      {
        first_name: nome.primeiro,
        last_name: nome.ultimo,
        domain: lead.dominio ?? undefined,
        company_name: lead.nome,
        linkedin_url: decisor.linkedin_url ?? undefined,
        enrich_fields: ['contact.work_emails', 'contact.phones'],
        custom: {
          dono,
          lista,
          chave: lead.chave_externa,
        },
      },
    ];
  });
  if (!dados.length) return { leads, iniciado: false };

  try {
    const webhook = new URL('/functions/v1/prospeccao-fullenrich', env.NEXT_PUBLIC_SUPABASE_URL);
    webhook.searchParams.set('segredo', segredo);
    const resposta = await fetch(
      'https://app.fullenrich.com/api/v2/contact/enrich/bulk?silentFail=true',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Subido · ${lista}`,
          webhook_url: webhook.toString(),
          data: dados,
        }),
        cache: 'no-store',
        signal: AbortSignal.timeout(15_000),
      },
    );
    const json = (await jsonDaResposta(resposta)) as Registro;
    const id = texto(json.enrichment_id);
    if (!id) return { leads, iniciado: false };

    return {
      iniciado: true,
      leads: leads.map((lead) => ({
        ...lead,
        dados: {
          ...lead.dados,
          fullenrich_contatos: { status: 'processando', id },
        },
      })),
    };
  } catch {
    return { leads, iniciado: false };
  }
}
