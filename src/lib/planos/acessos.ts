export type PlanoSubido = 'starter' | 'pro' | 'enterprise';

export type RecursoPlano =
  | 'aprendizado'
  | 'projetos'
  | 'sobral_ai'
  | 'mentorias'
  | 'certificados'
  | 'reunioes'
  | 'live_coach'
  | 'modulo_comercial'
  | 'enriquecimento'
  | 'recursos_avancados';

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
      'modulo_comercial',
      'enriquecimento',
      'recursos_avancados',
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
  { id: 'essencial', nome: 'Essencial', creditos: 50 },
  { id: 'crescimento', nome: 'Crescimento', creditos: 150 },
  { id: 'escala', nome: 'Escala', creditos: 500 },
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

const ROTAS_COMERCIAIS = ['/prospeccao', '/vendas', '/metricas', '/propostas'] as const;

export function planoPodeAcessarRota(plano: PlanoSubido, href: string): boolean {
  if (!ROTAS_COMERCIAIS.some((rota) => href === rota || href.startsWith(`${rota}/`))) return true;
  return planoTemRecurso(plano, 'modulo_comercial');
}
