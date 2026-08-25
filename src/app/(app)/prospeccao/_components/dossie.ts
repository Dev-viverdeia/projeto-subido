import type { Json, Tables } from '@/lib/supabase/types.generated';

export type Lead = Pick<
  Tables<'prospeccao_leads'>,
  | 'id'
  | 'nome'
  | 'categoria'
  | 'endereco'
  | 'cidade'
  | 'estado'
  | 'site_url'
  | 'dominio'
  | 'telefone'
  | 'telefones'
  | 'emails'
  | 'redes_sociais'
  | 'decisores'
  | 'horarios'
  | 'maps_url'
  | 'imagem_url'
  | 'avaliacao'
  | 'total_avaliacoes'
  | 'descricao'
  | 'fontes'
  | 'qualificacao'
  | 'dados'
  | 'crm_oportunidade_id'
>;

export type RedeSocial = {
  rede: 'instagram' | 'facebook' | 'linkedin' | 'x' | 'tiktok' | 'youtube' | 'pinterest';
  url: string;
};

export type Decisor = {
  nome: string;
  cargo: string | null;
  senioridade: string | null;
  linkedin_url: string | null;
  localizacao: string | null;
  email: string | null;
  telefone: string | null;
  fonte: string;
};

type Horario = { dia: string; horarios: string };
export type OportunidadeProjeto = {
  projeto_slug:
    | 'sdr-atendimento-qualificacao'
    | 'maquina-prospeccao-b2b'
    | 'inteligencia-comercial-com-ia'
    | 'operacao-conteudo-multicanal'
    | 'radar-satisfacao-com-ia';
  projeto_titulo: string;
  motivo: string;
  pergunta_abertura: string;
  melhor_canal: 'whatsapp' | 'telefone' | 'email' | 'linkedin' | 'instagram';
  confianca: 'alta' | 'media' | 'inicial';
  evidencias: string[];
};

type Qualificacao = {
  completude: number;
  itens: {
    telefone: boolean;
    email: boolean;
    site: boolean;
    redes_sociais: boolean;
    decisores: boolean;
  };
  sinais: string[];
  oportunidade: OportunidadeProjeto | null;
};

export function objeto(valor: Json | null): Record<string, Json | undefined> {
  return valor && typeof valor === 'object' && !Array.isArray(valor) ? valor : {};
}

function stringsDo(valor: Json): string[] {
  return Array.isArray(valor)
    ? valor.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
    : [];
}

export function fontesDo(lead: Lead) {
  return stringsDo(lead.fontes);
}

export function telefonesDo(lead: Lead) {
  const porNumero = new Map<string, string>();
  for (const telefone of [lead.telefone, ...stringsDo(lead.telefones)]) {
    if (!telefone) continue;
    const digitos = telefone.replace(/\D/g, '');
    if (digitos.length >= 10 && !porNumero.has(digitos)) porNumero.set(digitos, telefone);
  }
  return [...porNumero.values()];
}

export function emailsDo(lead: Lead) {
  return stringsDo(lead.emails);
}

export function redesDo(lead: Lead): RedeSocial[] {
  if (!Array.isArray(lead.redes_sociais)) return [];
  const permitidas = new Set([
    'instagram',
    'facebook',
    'linkedin',
    'x',
    'tiktok',
    'youtube',
    'pinterest',
  ]);
  const encontradas = lead.redes_sociais.flatMap((item) => {
    const registro = item && typeof item === 'object' && !Array.isArray(item) ? item : null;
    const rede = registro && typeof registro.rede === 'string' ? registro.rede : null;
    const url = registro && typeof registro.url === 'string' ? registro.url : null;
    return rede && url && permitidas.has(rede) ? [{ rede, url } as RedeSocial] : [];
  });
  const ordem: RedeSocial['rede'][] = [
    'instagram',
    'linkedin',
    'facebook',
    'tiktok',
    'youtube',
    'x',
    'pinterest',
  ];
  return ordem.flatMap((rede) => {
    const perfil = encontradas.find((item) => item.rede === rede);
    return perfil ? [perfil] : [];
  });
}

export function decisoresDo(lead: Lead): Decisor[] {
  if (!Array.isArray(lead.decisores)) return [];
  return lead.decisores.flatMap((item) => {
    const registro = item && typeof item === 'object' && !Array.isArray(item) ? item : null;
    const nome = registro && typeof registro.nome === 'string' ? registro.nome : null;
    if (!nome) return [];
    const opcional = (campo: string) => {
      const valor = registro?.[campo];
      return typeof valor === 'string' && valor.trim() ? valor : null;
    };
    return [
      {
        nome,
        cargo: opcional('cargo'),
        senioridade: opcional('senioridade'),
        linkedin_url: opcional('linkedin_url'),
        localizacao: opcional('localizacao'),
        email: opcional('email'),
        telefone: opcional('telefone'),
        fonte: opcional('fonte') ?? 'Perfil profissional público',
      },
    ];
  });
}

export function horariosDo(lead: Lead): Horario[] {
  if (!Array.isArray(lead.horarios)) return [];
  return lead.horarios.flatMap((item) => {
    const registro = item && typeof item === 'object' && !Array.isArray(item) ? item : null;
    const dia = registro && typeof registro.dia === 'string' ? registro.dia : null;
    const horarios = registro && typeof registro.horarios === 'string' ? registro.horarios : null;
    return dia && horarios ? [{ dia, horarios }] : [];
  });
}

export function qualificacaoDo(lead: Lead): Qualificacao {
  const itens = {
    telefone: telefonesDo(lead).length > 0,
    email: emailsDo(lead).length > 0,
    site: Boolean(lead.site_url),
    redes_sociais: redesDo(lead).length > 0,
    decisores: decisoresDo(lead).length > 0,
  };
  const padrao =
    (itens.telefone ? 20 : 0) +
    (itens.email ? 25 : 0) +
    (itens.site ? 15 : 0) +
    (itens.redes_sociais ? 15 : 0) +
    (itens.decisores ? 25 : 0);
  const bruto = objeto(lead.qualificacao);
  const oportunidadeBruta = objeto(bruto.oportunidade ?? null);
  const projetoSlug = oportunidadeBruta.projeto_slug;
  const projetoTitulo = oportunidadeBruta.projeto_titulo;
  const motivo = oportunidadeBruta.motivo;
  const perguntaAbertura = oportunidadeBruta.pergunta_abertura;
  const melhorCanal = oportunidadeBruta.melhor_canal;
  const confianca = oportunidadeBruta.confianca;
  const projetos = new Set<OportunidadeProjeto['projeto_slug']>([
    'sdr-atendimento-qualificacao',
    'maquina-prospeccao-b2b',
    'inteligencia-comercial-com-ia',
    'operacao-conteudo-multicanal',
    'radar-satisfacao-com-ia',
  ]);
  const canais = new Set<OportunidadeProjeto['melhor_canal']>([
    'whatsapp',
    'telefone',
    'email',
    'linkedin',
    'instagram',
  ]);
  const confiancas = new Set<OportunidadeProjeto['confianca']>(['alta', 'media', 'inicial']);
  const oportunidade =
    typeof projetoSlug === 'string' &&
    projetos.has(projetoSlug as OportunidadeProjeto['projeto_slug']) &&
    typeof projetoTitulo === 'string' &&
    typeof motivo === 'string' &&
    typeof perguntaAbertura === 'string' &&
    typeof melhorCanal === 'string' &&
    canais.has(melhorCanal as OportunidadeProjeto['melhor_canal']) &&
    typeof confianca === 'string' &&
    confiancas.has(confianca as OportunidadeProjeto['confianca'])
      ? {
          projeto_slug: projetoSlug as OportunidadeProjeto['projeto_slug'],
          projeto_titulo: projetoTitulo,
          motivo,
          pergunta_abertura: perguntaAbertura,
          melhor_canal: melhorCanal as OportunidadeProjeto['melhor_canal'],
          confianca: confianca as OportunidadeProjeto['confianca'],
          evidencias: stringsDo(oportunidadeBruta.evidencias ?? []),
        }
      : null;
  return {
    completude:
      typeof bruto.completude === 'number' && bruto.completude >= 0 && bruto.completude <= 100
        ? bruto.completude
        : padrao,
    itens,
    sinais: stringsDo(bruto.sinais ?? []),
    oportunidade,
  };
}

export function rotuloCompletude(valor: number) {
  if (valor >= 80) return 'Muitos dados encontrados';
  if (valor >= 55) return 'Boa base de contato';
  if (valor >= 30) return 'Dados parciais';
  return 'Base inicial';
}

export function rotuloRede(rede: RedeSocial['rede']) {
  return {
    instagram: 'Instagram',
    facebook: 'Facebook',
    linkedin: 'LinkedIn',
    x: 'X',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    pinterest: 'Pinterest',
  }[rede];
}

export function urlWhatsapp(telefone: string) {
  let digitos = telefone.replace(/\D/g, '');
  if ((digitos.length === 10 || digitos.length === 11) && !digitos.startsWith('55')) {
    digitos = `55${digitos}`;
  }
  return digitos.length >= 12 && digitos.length <= 13 ? `https://wa.me/${digitos}` : null;
}

export function identificadorRede(rede: RedeSocial) {
  try {
    const url = new URL(rede.url);
    const partes = url.pathname.split('/').filter(Boolean);
    const perfil = partes.at(-1)?.replace(/^@/, '');
    return perfil ? `@${perfil}` : rotuloRede(rede.rede);
  } catch {
    return rotuloRede(rede.rede);
  }
}

function contatosDoSite(lead: Lead) {
  const dados = objeto(lead.dados);
  return objeto(dados.site_contatos ?? null);
}

export function fonteDoContato(lead: Lead, tipo: 'telefone' | 'email' | 'rede', valor: string) {
  const site = contatosDoSite(lead);
  const campo =
    tipo === 'telefone' ? site.telefones : tipo === 'email' ? site.emails : site.redes_sociais;
  const encontradoNoSite = Array.isArray(campo)
    ? campo.some((item) => {
        if (typeof item === 'string') return item === valor;
        const registro = item && typeof item === 'object' && !Array.isArray(item) ? item : null;
        return registro?.url === valor;
      })
    : false;
  return encontradoNoSite ? 'Site oficial' : 'Google Maps';
}

export function totalCanaisAcionaveis(lead: Lead) {
  return telefonesDo(lead).length + emailsDo(lead).length + redesDo(lead).length;
}

export function setorProfissionalDo(lead: Lead): string | null {
  const empresa = objeto(objeto(lead.dados).empresa_profissional ?? null);
  return typeof empresa.setor === 'string' ? empresa.setor : null;
}

export function perfilEmpresaDo(lead: Lead) {
  const empresa = objeto(objeto(lead.dados).empresa_profissional ?? null);
  const porteRecebido = empresa.porte;
  const porte =
    typeof porteRecebido === 'string' || typeof porteRecebido === 'number'
      ? String(porteRecebido)
      : null;
  return {
    setor: typeof empresa.setor === 'string' ? empresa.setor : null,
    porte,
    anoFundacao: typeof empresa.ano_fundacao === 'number' ? empresa.ano_fundacao : null,
    especialidades: stringsDo(empresa.especialidades ?? []),
  };
}

export function enriquecimentoDeContatosEmAndamento(lead: Lead) {
  const estado = objeto(objeto(lead.dados).fullenrich_contatos ?? null);
  return estado.status === 'processando';
}
