import type { Json } from '@/lib/supabase/types.generated';

const PROJETOS_PROSPECCAO = new Set([
  'sdr-atendimento-qualificacao',
  'maquina-prospeccao-b2b',
  'inteligencia-comercial-com-ia',
  'operacao-conteudo-multicanal',
  'radar-satisfacao-com-ia',
]);

export function projetoSugeridoDaProspeccao(valor: Json | null): string | null {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return null;
  const qualificacao = valor.qualificacao;
  if (!qualificacao || typeof qualificacao !== 'object' || Array.isArray(qualificacao)) return null;
  const oportunidade = qualificacao.oportunidade;
  if (!oportunidade || typeof oportunidade !== 'object' || Array.isArray(oportunidade)) return null;
  const slug = oportunidade.projeto_slug;
  return typeof slug === 'string' && PROJETOS_PROSPECCAO.has(slug) ? slug : null;
}
