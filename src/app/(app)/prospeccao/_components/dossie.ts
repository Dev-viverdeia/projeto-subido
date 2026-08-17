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
  | 'enviado_crm_em'
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
  const telefones = stringsDo(lead.telefones);
  return [
    ...new Set([lead.telefone, ...telefones].filter((item): item is string => Boolean(item))),
  ];
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
  return lead.redes_sociais.flatMap((item) => {
    const registro = item && typeof item === 'object' && !Array.isArray(item) ? item : null;
    const rede = registro && typeof registro.rede === 'string' ? registro.rede : null;
    const url = registro && typeof registro.url === 'string' ? registro.url : null;
    return rede && url && permitidas.has(rede) ? [{ rede, url } as RedeSocial] : [];
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
  return {
    completude:
      typeof bruto.completude === 'number' && bruto.completude >= 0 && bruto.completude <= 100
        ? bruto.completude
        : padrao,
    itens,
    sinais: stringsDo(bruto.sinais ?? []),
  };
}

export function rotuloCompletude(valor: number) {
  if (valor >= 80) return 'Dossiê muito completo';
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

export function setorProfissionalDo(lead: Lead): string | null {
  const empresa = objeto(objeto(lead.dados).empresa_profissional ?? null);
  return typeof empresa.setor === 'string' ? empresa.setor : null;
}
