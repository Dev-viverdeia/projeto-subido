import type { SolucaoResumo } from '@/lib/conteudo/queries';

type ProjetoDisponivel = Pick<SolucaoResumo, 'slug' | 'titulo'>;

const SINAIS_PROJETO = [
  {
    slug: 'sdr-atendimento-qualificacao',
    sinais: [
      'atendimento',
      'whatsapp',
      'suporte',
      'sac',
      'chat',
      'mensagem',
      'sdr',
      'qualificacao',
    ],
  },
  {
    slug: 'maquina-prospeccao-b2b',
    sinais: ['lead', 'prospeccao', 'captacao', 'lista', 'decisor', 'enriquecimento'],
  },
  {
    slug: 'inteligencia-comercial-com-ia',
    sinais: ['reuniao', 'call', 'crm', 'pipeline', 'venda', 'comercial', 'follow up', 'negociacao'],
  },
  {
    slug: 'operacao-conteudo-multicanal',
    sinais: ['conteudo', 'marketing', 'social', 'instagram', 'campanha', 'editorial', 'multicanal'],
  },
  {
    slug: 'radar-satisfacao-com-ia',
    sinais: ['satisfacao', 'nps', 'csat', 'feedback', 'detrator', 'cliente insatisfeito'],
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
