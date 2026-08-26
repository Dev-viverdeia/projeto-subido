import 'server-only';

import { LeadProspeccaoSchema, type LeadProspeccaoEntrada } from './schema';
import { redesDeUrls } from './redes-sociais';

export { redesDeUrls } from './redes-sociais';

export type Registro = Record<string, unknown>;
type RedeSocial = LeadProspeccaoEntrada['redes_sociais'][number];

export function texto(valor: unknown): string | null {
  return typeof valor === 'string' && valor.trim() ? valor.trim() : null;
}

function numero(valor: unknown): number | null {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : null;
}

export function inteiro(valor: unknown): number | null {
  const recebido = numero(valor);
  return recebido === null ? null : Math.max(0, Math.trunc(recebido));
}

export function comoRegistro(valor: unknown): Registro | null {
  return valor && typeof valor === 'object' && !Array.isArray(valor) ? (valor as Registro) : null;
}

function textos(valor: unknown): string[] {
  const valores = Array.isArray(valor) ? valor : [valor];
  return valores.map(texto).filter((item): item is string => Boolean(item));
}

export function urlPublica(valor: unknown): string | null {
  const recebida = texto(valor);
  if (!recebida) return null;
  try {
    const url = new URL(recebida.startsWith('http') ? recebida : `https://${recebida}`);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

const DOMINIOS_QUE_NAO_SAO_SITE = [
  'whatsapp.com',
  'wa.me',
  'instagram.com',
  'facebook.com',
  'fb.com',
  'linkedin.com',
  'x.com',
  'twitter.com',
  'tiktok.com',
  'youtube.com',
  'youtu.be',
  'pinterest.com',
  'pin.it',
  'google.com',
  'google.com.br',
  'g.page',
  'goo.gl',
  'linktr.ee',
  'beacons.ai',
  'bio.site',
] as const;

function dominioBloqueado(dominio: string) {
  return DOMINIOS_QUE_NAO_SAO_SITE.some(
    (bloqueado) => dominio === bloqueado || dominio.endsWith(`.${bloqueado}`),
  );
}

export function siteOficial(valor: unknown): string | null {
  const publica = urlPublica(valor);
  if (!publica) return null;
  const dominio = new URL(publica).hostname.replace(/^www\./, '').toLocaleLowerCase('pt-BR');
  return dominioBloqueado(dominio) ? null : publica;
}

function dominioDe(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

export function unicos(valores: Array<string | null | undefined>): string[] {
  return [...new Set(valores.filter((valor): valor is string => Boolean(valor)))];
}

export function emailsValidos(valor: unknown): string[] {
  return unicos(
    textos(valor).map((email) => {
      const normalizado = email.toLocaleLowerCase('pt-BR');
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizado) ? normalizado : null;
    }),
  ).slice(0, 12);
}

export function telefonesUnicos(valores: Array<string | null | undefined>): string[] {
  const vistos = new Set<string>();
  return valores.flatMap((valor) => {
    const recebido = texto(valor);
    if (!recebido) return [];
    const digitos = recebido.replace(/\D/g, '');
    if (digitos.length < 10 || digitos.length > 13 || vistos.has(digitos)) return [];
    vistos.add(digitos);
    return [recebido];
  });
}

function redesDo(registroFonte: Registro): RedeSocial[] {
  const campos: Array<[RedeSocial['rede'], string[]]> = [
    ['instagram', ['instagram', 'instagrams']],
    ['facebook', ['facebook', 'facebooks']],
    ['linkedin', ['linkedin', 'linkedIn', 'linkedIns', 'linkedins']],
    ['x', ['x', 'twitter', 'twitters']],
    ['tiktok', ['tiktok', 'tiktoks']],
    ['youtube', ['youtube', 'youtubes']],
    ['pinterest', ['pinterest', 'pinterests']],
  ];
  const candidatos = campos.flatMap(([rede, nomes]) =>
    nomes.flatMap((campo) =>
      textos(registroFonte[campo]).flatMap((valor) => {
        const perfil = redesDeUrls([valor]).find((item) => item.rede === rede);
        return perfil ? [perfil] : [];
      }),
    ),
  );
  const grupos = ['socials', 'socialProfiles', 'socialMedia'].flatMap((campo) => {
    const valor = registroFonte[campo];
    if (Array.isArray(valor)) {
      return valor.flatMap((item) => {
        const registro = comoRegistro(item);
        return registro ? textos(registro.url ?? registro.link) : textos(item);
      });
    }
    const registro = comoRegistro(valor);
    return registro ? Object.values(registro).flatMap((item) => textos(item)) : textos(valor);
  });
  const extras = redesDeUrls(grupos);
  return redesDeUrls([...candidatos.map((item) => item.url), ...extras.map((item) => item.url)]);
}

function horariosDo(valor: unknown): LeadProspeccaoEntrada['horarios'] {
  if (!Array.isArray(valor)) return [];
  return valor
    .map((item) => {
      const objeto = comoRegistro(item);
      const dia = texto(objeto?.day);
      const horarios = texto(objeto?.hours);
      return dia && horarios ? { dia, horarios } : null;
    })
    .filter((item): item is { dia: string; horarios: string } => Boolean(item))
    .slice(0, 14);
}

export function qualificar(lead: Omit<LeadProspeccaoEntrada, 'qualificacao'>) {
  const itens = {
    telefone: lead.telefones.length > 0 || Boolean(lead.telefone),
    email: lead.emails.length > 0,
    site: Boolean(lead.site_url),
    redes_sociais: lead.redes_sociais.length > 0,
    decisores: lead.decisores.length > 0,
  };
  const completude =
    (itens.telefone ? 20 : 0) +
    (itens.email ? 25 : 0) +
    (itens.site ? 15 : 0) +
    (itens.redes_sociais ? 15 : 0) +
    (itens.decisores ? 25 : 0);
  const sinais: string[] = [];
  if (itens.telefone && itens.email) sinais.push('Telefone e e-mail disponíveis para abordagem');
  else if (itens.telefone || itens.email)
    sinais.push('Ao menos um canal direto de contato disponível');
  if (itens.site && itens.redes_sociais) sinais.push('Site e presença social encontrados');
  if (itens.decisores) sinais.push('Possível decisor profissional mapeado');
  if ((lead.avaliacao ?? 0) >= 4.5 && (lead.total_avaliacoes ?? 0) >= 50) {
    sinais.push('Boa reputação pública e volume relevante de avaliações');
  }
  if (!itens.email) sinais.push('E-mail público não encontrado; confirmar antes da abordagem');
  if (!itens.decisores) sinais.push('Decisor ainda não identificado em fonte profissional');
  return { completude, itens, sinais: sinais.slice(0, 8) };
}

function comQualificacao(lead: Omit<LeadProspeccaoEntrada, 'qualificacao'>) {
  return { ...lead, qualificacao: qualificar(lead) };
}

function chaveDo(registro: Registro, nome: string, endereco: string | null, site: string | null) {
  return (
    texto(registro.place_id) ??
    texto(registro.placeId) ??
    texto(registro.data_id) ??
    texto(registro.cid) ??
    dominioDe(site) ??
    `${nome}|${endereco ?? ''}`.toLocaleLowerCase('pt-BR')
  );
}

export function origemSerp(registro: Registro): LeadProspeccaoEntrada | null {
  const nome = texto(registro.title);
  if (!nome) return null;
  const site = siteOficial(registro.website);
  const endereco = texto(registro.address);
  const telefone = texto(registro.phone);
  const base = {
    chave_externa: chaveDo(registro, nome, endereco, site),
    nome,
    categoria: texto(registro.type),
    endereco,
    cidade: null,
    estado: null,
    site_url: site,
    dominio: dominioDe(site),
    telefone,
    telefones: unicos([telefone]),
    emails: [],
    redes_sociais: [],
    decisores: [],
    horarios: [],
    maps_url: urlPublica(registro.place_id_search) ?? urlPublica(registro.directions),
    imagem_url: null,
    avaliacao: numero(registro.rating),
    total_avaliacoes: inteiro(registro.reviews),
    descricao: texto(registro.description),
    fontes: ['Google Maps · dados públicos'],
    dados: { place_id: texto(registro.place_id), horario: registro.operating_hours ?? null },
  } satisfies Omit<LeadProspeccaoEntrada, 'qualificacao'>;
  const resultado = LeadProspeccaoSchema.safeParse(comQualificacao(base));
  return resultado.success ? resultado.data : null;
}

export function origemApify(registro: Registro): LeadProspeccaoEntrada | null {
  const nome = texto(registro.title) ?? texto(registro.name);
  if (!nome) return null;
  const site = siteOficial(registro.website);
  const endereco = texto(registro.address);
  const categorias = Array.isArray(registro.categories)
    ? registro.categories.filter((item): item is string => typeof item === 'string')
    : [];
  const telefone = texto(registro.phone) ?? texto(registro.phoneUnformatted);
  const telefones = telefonesUnicos([telefone, ...textos(registro.phones)]).slice(0, 12);
  const base = {
    chave_externa: chaveDo(registro, nome, endereco, site),
    nome,
    categoria: texto(registro.categoryName) ?? categorias[0] ?? null,
    endereco,
    cidade: texto(registro.city),
    estado: texto(registro.state),
    site_url: site,
    dominio: dominioDe(site),
    telefone: telefone ?? telefones[0] ?? null,
    telefones,
    emails: emailsValidos(registro.emails),
    redes_sociais: redesDo(registro),
    decisores: [],
    horarios: horariosDo(registro.openingHours),
    maps_url: urlPublica(registro.url),
    imagem_url: urlPublica(registro.imageUrl),
    avaliacao: numero(registro.totalScore),
    total_avaliacoes: inteiro(registro.reviewsCount),
    descricao: texto(registro.description),
    fontes: ['Google Maps · dados públicos'],
    dados: {
      place_id: texto(registro.placeId),
      categoria_secundaria: categorias[1] ?? null,
      categorias,
      bairro: texto(registro.neighborhood),
      cep: texto(registro.postalCode),
      faixa_preco: texto(registro.price),
      localizacao: comoRegistro(registro.location),
      distribuicao_avaliacoes: comoRegistro(registro.reviewsDistribution),
      informacoes_adicionais: comoRegistro(registro.additionalInfo),
    },
  } satisfies Omit<LeadProspeccaoEntrada, 'qualificacao'>;
  const resultado = LeadProspeccaoSchema.safeParse(comQualificacao(base));
  return resultado.success ? resultado.data : null;
}

export function origemFullEnrichEmpresa(registro: Registro): LeadProspeccaoEntrada | null {
  const nome = texto(registro.name);
  if (!nome) return null;
  const dominio =
    texto(registro.domain)
      ?.replace(/^www\./, '')
      .toLocaleLowerCase('pt-BR') ?? null;
  const site = dominio ? siteOficial(`https://${dominio}`) : null;
  const localizacoes = comoRegistro(registro.locations);
  const sede = comoRegistro(localizacoes?.headquarters);
  const industria = comoRegistro(registro.industry);
  const perfis = comoRegistro(registro.social_profiles);
  const profissional = comoRegistro(perfis?.professional_network);
  const linkedin = redesDeUrls([texto(profissional?.url) ?? '']).find(
    (item) => item.rede === 'linkedin',
  );
  const cidade = texto(sede?.city);
  const estado = texto(sede?.region);
  const endereco = [texto(sede?.line1), texto(sede?.line2)].filter(Boolean).join(', ') || null;
  const base = {
    chave_externa: texto(registro.id) ?? dominio ?? `${nome}|${cidade ?? ''}`.toLowerCase(),
    nome,
    categoria: texto(industria?.main_industry),
    endereco,
    cidade,
    estado,
    site_url: site,
    dominio,
    telefone: null,
    telefones: [],
    emails: [],
    redes_sociais: linkedin ? [linkedin] : [],
    decisores: [],
    horarios: [],
    maps_url: null,
    imagem_url: null,
    avaliacao: null,
    total_avaliacoes: null,
    descricao: texto(registro.description),
    fontes: ['FullEnrich · dados profissionais públicos'],
    dados: {
      fullenrich_company_id: texto(registro.id),
      empresa_profissional: {
        setor: texto(industria?.main_industry),
        porte: registro.headcount_range ?? registro.headcount ?? null,
        ano_fundacao: inteiro(registro.year_founded),
        tipo: texto(registro.company_type),
        especialidades: Array.isArray(registro.specialties) ? registro.specialties : [],
      },
    },
  } satisfies Omit<LeadProspeccaoEntrada, 'qualificacao'>;
  const resultado = LeadProspeccaoSchema.safeParse(comQualificacao(base));
  return resultado.success ? resultado.data : null;
}

export async function jsonDaResposta(resposta: Response): Promise<unknown> {
  const json: unknown = await resposta.json().catch(() => null);
  if (!resposta.ok) throw new Error(`provedor_http_${resposta.status}`);
  return json;
}
