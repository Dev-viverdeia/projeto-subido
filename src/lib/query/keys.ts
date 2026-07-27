/**
 * Fábrica de query keys.
 *
 * POR QUE UMA FÁBRICA, E POR QUE O LINT A OBRIGA
 * Query key é o identificador de cache do React Query. Escrita inline, ela é uma
 * string mágica repetida em N arquivos — e a invalidação passa a depender de todo
 * mundo digitar exatamente o mesmo array. Na plataforma de referência existia uma
 * fábrica igual a esta; ela falhou porque nada impedia o array inline ao lado. Aqui
 * `Property[key.name='queryKey'] > ArrayExpression` é erro de lint
 * (ver eslint.config.mjs), então a fábrica é o único caminho.
 *
 * HIERARQUIA
 * Cada grupo começa por `todas()`, e as chaves específicas o estendem. Isso é o que
 * faz `invalidateQueries({ queryKey: keys.solucoes.todas() })` limpar lista e
 * detalhes de uma vez — o React Query casa por prefixo.
 *
 * LEMBRETE DE ESCOPO: React Query aqui é só para estado de CLIENTE (lista infinita
 * com filtro, toggle otimista, polling). Leitura no load é RSC, sem chave nenhuma.
 */

export type FiltroSolucoes = {
  busca?: string;
  categoria?: string;
  concluidas?: boolean;
};

export const keys = {
  solucoes: {
    todas: () => ['solucoes'] as const,
    lista: (filtro: FiltroSolucoes) => [...keys.solucoes.todas(), 'lista', filtro] as const,
    detalhe: (slug: string) => [...keys.solucoes.todas(), 'detalhe', slug] as const,
    progresso: (slug: string) => [...keys.solucoes.detalhe(slug), 'progresso'] as const,
  },

  formacoes: {
    todas: () => ['formacoes'] as const,
    lista: () => [...keys.formacoes.todas(), 'lista'] as const,
    detalhe: (slug: string) => [...keys.formacoes.todas(), 'detalhe', slug] as const,
    aula: (slug: string, aulaId: string) =>
      [...keys.formacoes.detalhe(slug), 'aula', aulaId] as const,
  },

  builder: {
    todas: () => ['builder'] as const,
    projetos: () => [...keys.builder.todas(), 'projetos'] as const,
    projeto: (id: string) => [...keys.builder.todas(), 'projeto', id] as const,
  },

  mentorias: {
    todas: () => ['mentorias'] as const,
    agenda: () => [...keys.mentorias.todas(), 'agenda'] as const,
    gravacoes: () => [...keys.mentorias.todas(), 'gravacoes'] as const,
    creditos: () => [...keys.mentorias.todas(), 'creditos'] as const,
  },

  conta: {
    todas: () => ['conta'] as const,
    perfil: () => [...keys.conta.todas(), 'perfil'] as const,
    assinatura: () => [...keys.conta.todas(), 'assinatura'] as const,
    certificados: () => [...keys.conta.todas(), 'certificados'] as const,
  },
} as const;
