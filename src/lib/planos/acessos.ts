export type PlanoSubido = 'starter' | 'pro' | 'enterprise';

export type RecursoPlano =
  | 'aprendizado'
  | 'projetos'
  | 'sobral_ai'
  | 'mentorias'
  | 'certificados'
  | 'reunioes'
  | 'live_coach'
  | 'estudio'
  | 'prospeccao'
  | 'vendas'
  | 'metricas'
  | 'propostas'
  | 'modulo_comercial'
  | 'enriquecimento'
  | 'recursos_avancados'
  | 'gestao_equipe';

export type DefinicaoRecurso = {
  nome: string;
  descricao: string;
  planoMinimo: PlanoSubido;
};

/**
 * Catálogo único de permissões. Interface, rotas e mutações usam esta mesma
 * fonte para que uma área nunca apareça liberada e falhe apenas depois.
 */
export const RECURSOS_SUBIDO: Record<RecursoPlano, DefinicaoRecurso> = {
  aprendizado: {
    nome: 'Formações',
    descricao: 'Aulas e trilhas para aprender a vender e entregar projetos de IA.',
    planoMinimo: 'starter',
  },
  projetos: {
    nome: 'Projetos',
    descricao: 'Projetos de IA prontos para estudar, vender e implementar.',
    planoMinimo: 'starter',
  },
  sobral_ai: {
    nome: 'Sobral AI',
    descricao: 'Orientação conectada às aulas, projetos e próximos passos da plataforma.',
    planoMinimo: 'starter',
  },
  mentorias: {
    nome: 'Mentorias',
    descricao: 'Sessões ao vivo para destravar vendas e entregas.',
    planoMinimo: 'starter',
  },
  certificados: {
    nome: 'Certificados',
    descricao: 'Certificados das formações e projetos concluídos.',
    planoMinimo: 'starter',
  },
  reunioes: {
    nome: 'Reuniões',
    descricao: 'Agenda, sala pública, gravação e histórico das reuniões.',
    planoMinimo: 'starter',
  },
  live_coach: {
    nome: 'Live Coach',
    descricao: 'Orientação em tempo real durante as reuniões comerciais.',
    planoMinimo: 'starter',
  },
  estudio: {
    nome: 'Estúdio',
    descricao: 'Projetos personalizados a partir do contexto real do cliente.',
    planoMinimo: 'pro',
  },
  prospeccao: {
    nome: 'Prospecção',
    descricao: 'Listas qualificadas com empresas e contatos para abordar.',
    planoMinimo: 'pro',
  },
  vendas: {
    nome: 'Vendas',
    descricao: 'Pipeline guiado para transformar oportunidades em clientes.',
    planoMinimo: 'pro',
  },
  metricas: {
    nome: 'Métricas',
    descricao: 'Diagnóstico da produtividade e das conversões comerciais.',
    planoMinimo: 'pro',
  },
  propostas: {
    nome: 'Propostas',
    descricao: 'Propostas comerciais conectadas às oportunidades.',
    planoMinimo: 'pro',
  },
  modulo_comercial: {
    nome: 'Operação comercial',
    descricao: 'Prospecção, vendas, métricas e propostas em uma única operação.',
    planoMinimo: 'pro',
  },
  enriquecimento: {
    nome: 'Enriquecimento de oportunidade',
    descricao: 'Pesquisa de empresa, decisores e contexto para preparar a venda.',
    planoMinimo: 'pro',
  },
  recursos_avancados: {
    nome: 'Recursos avançados',
    descricao: 'Ferramentas avançadas para personalizar e escalar a operação.',
    planoMinimo: 'pro',
  },
  gestao_equipe: {
    nome: 'Gestão de equipe',
    descricao: 'Controles e visão compartilhada para operações com equipe.',
    planoMinimo: 'enterprise',
  },
};

export const PLANOS_SUBIDO: Record<
  PlanoSubido,
  { nome: string; descricao: string; recursos: readonly RecursoPlano[] }
> = {
  starter: {
    nome: 'Starter',
    descricao: 'Formação, projetos, mentorias e reuniões com Live Coach.',
    recursos: [
      'aprendizado',
      'projetos',
      'sobral_ai',
      'mentorias',
      'certificados',
      'reunioes',
      'live_coach',
    ],
  },
  pro: {
    nome: 'Pro',
    descricao: 'Formação completa e operação comercial para conquistar clientes.',
    recursos: [
      'aprendizado',
      'projetos',
      'sobral_ai',
      'mentorias',
      'certificados',
      'reunioes',
      'live_coach',
      'estudio',
      'prospeccao',
      'vendas',
      'metricas',
      'propostas',
      'modulo_comercial',
      'enriquecimento',
      'recursos_avancados',
    ],
  },
  enterprise: {
    nome: 'Enterprise',
    descricao: 'Todos os recursos, com controles avançados para equipes.',
    recursos: [
      'aprendizado',
      'projetos',
      'sobral_ai',
      'mentorias',
      'certificados',
      'reunioes',
      'live_coach',
      'estudio',
      'prospeccao',
      'vendas',
      'metricas',
      'propostas',
      'modulo_comercial',
      'enriquecimento',
      'recursos_avancados',
      'gestao_equipe',
    ],
  },
};

export const RECURSOS_BASE_PLANO = [
  'Formações e projetos passo a passo',
  'Sobral AI para orientar o próximo passo',
  'Reuniões com Live Coach',
  'Mentorias e certificados',
] as const;

export const RECURSOS_COMERCIAIS_PLANO = [
  'Prospecção e listas qualificadas',
  'Vendas e métricas comerciais',
  'Propostas conectadas às oportunidades',
  'Enriquecimento das fichas de clientes',
] as const;

/** Pacotes fixos: o checkout escolhe um pacote, nunca uma quantidade avulsa. */
export const PACOTES_CREDITOS = [
  { id: 'essencial', nome: 'Essencial', creditos: 50, descricao: 'Para novas listas e análises.' },
  {
    id: 'crescimento',
    nome: 'Crescimento',
    creditos: 150,
    descricao: 'Para uma rotina comercial recorrente.',
  },
  { id: 'escala', nome: 'Escala', creditos: 500, descricao: 'Para maior volume de clientes.' },
] as const;

/**
 * O plano vem exclusivamente de `app_metadata`, campo assinado pelo Supabase e
 * administrado pelo produto. Nunca use `user_metadata` para permissões: a
 * própria pessoa pode editar esse segundo objeto ao atualizar o perfil.
 *
 * Contas antigas sem a chave continuam como Pro. Uma migration grava essa
 * escolha nelas e inclui Starter automaticamente em todo cadastro novo.
 */
export function planoDosMetadados(metadata: unknown): PlanoSubido {
  if (!metadata || typeof metadata !== 'object') return 'pro';
  const valor = (metadata as Record<string, unknown>).plano_subido;
  return valor === 'starter' || valor === 'enterprise' || valor === 'pro' ? valor : 'pro';
}

export function planoTemRecurso(plano: PlanoSubido, recurso: RecursoPlano): boolean {
  return PLANOS_SUBIDO[plano].recursos.includes(recurso);
}

export const ROTAS_COM_RECURSO = [
  { href: '/prospeccao', recurso: 'prospeccao' },
  { href: '/propostas', recurso: 'propostas' },
  { href: '/metricas', recurso: 'metricas' },
  { href: '/builder', recurso: 'estudio' },
  { href: '/vendas', recurso: 'vendas' },
  { href: '/crm', recurso: 'vendas' },
  { href: '/reunioes', recurso: 'reunioes' },
  { href: '/calls', recurso: 'reunioes' },
  { href: '/consultor', recurso: 'sobral_ai' },
  { href: '/formacoes', recurso: 'aprendizado' },
  { href: '/solucoes', recurso: 'projetos' },
  { href: '/mentorias', recurso: 'mentorias' },
  { href: '/certificados', recurso: 'certificados' },
] as const satisfies readonly { href: string; recurso: RecursoPlano }[];

export const AREAS_COMERCIAIS = [
  { href: '/prospeccao', nome: 'Prospecção' },
  { href: '/vendas', nome: 'Vendas' },
  { href: '/crm', nome: 'Vendas' },
  { href: '/metricas', nome: 'Métricas' },
  { href: '/propostas', nome: 'Propostas' },
] as const;

export function planoPodeAcessarRota(plano: PlanoSubido, href: string): boolean {
  const recurso = recursoDaRota(href);
  return recurso ? planoTemRecurso(plano, recurso) : true;
}

export function recursoDaRota(href: unknown): RecursoPlano | null {
  if (typeof href !== 'string') return null;
  return (
    ROTAS_COM_RECURSO.find((rota) => href === rota.href || href.startsWith(`${rota.href}/`))
      ?.recurso ?? null
  );
}

export function definicaoDoRecurso(recurso: RecursoPlano): DefinicaoRecurso {
  return RECURSOS_SUBIDO[recurso];
}

export function nomeDaAreaBloqueada(href: unknown): string | null {
  const recurso = recursoDaRota(href);
  return recurso ? RECURSOS_SUBIDO[recurso].nome : null;
}

export function destinoDeUpgrade(recurso: RecursoPlano, origem?: string): string {
  const parametros = new URLSearchParams({ upgrade: recurso });
  if (origem) parametros.set('origem', origem);
  return `/conta/assinatura?${parametros.toString()}`;
}

export function recursoPlanoValido(valor: unknown): valor is RecursoPlano {
  return typeof valor === 'string' && Object.hasOwn(RECURSOS_SUBIDO, valor);
}

export function nomeDaAreaComercial(href: unknown): string | null {
  if (typeof href !== 'string') return null;
  return (
    AREAS_COMERCIAIS.find((area) => href === area.href || href.startsWith(`${area.href}/`))?.nome ??
    null
  );
}
