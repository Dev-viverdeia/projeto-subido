import type { SolucaoResumo } from '@/lib/conteudo/queries';

type ProjetoDisponivel = Pick<SolucaoResumo, 'slug' | 'titulo'>;

const SINAIS_PROJETO = [
  {
    slug: 'atendimento-com-ia-no-whatsapp',
    sinais: ['atendimento', 'whatsapp', 'suporte', 'sac', 'chat', 'mensagem'],
  },
  {
    slug: 'qualificacao-de-leads-com-ia',
    sinais: ['lead', 'prospeccao', 'captacao', 'qualificacao', 'sdr'],
  },
  {
    slug: 'crm-comercial-com-ia',
    sinais: ['crm', 'pipeline', 'venda', 'comercial', 'follow up', 'negociacao'],
  },
  {
    slug: 'maquina-de-conteudo-com-ia',
    sinais: ['conteudo', 'marketing', 'social', 'instagram', 'campanha', 'editorial'],
  },
  {
    slug: 'financeiro-sem-planilhas',
    sinais: ['financeiro', 'conta', 'orcamento', 'cobranca', 'pagamento', 'nota fiscal'],
  },
] as const;

function normalizar(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Recomenda somente um dos cinco Projetos oficiais e apenas quando o título do
 * lead oferece um sinal explícito. Sem sinal suficiente, a escolha segue humana.
 */
export function sugerirProjetoBase(
  tituloOportunidade: string,
  projetos: ProjetoDisponivel[],
): string | null {
  const titulo = normalizar(tituloOportunidade);
  const sugestao = SINAIS_PROJETO.find((item) =>
    item.sinais.some((sinal) => titulo.includes(sinal)),
  );
  if (!sugestao) return null;

  return projetos.some((projeto) => projeto.slug === sugestao.slug)
    ? `projeto:${sugestao.slug}`
    : null;
}
