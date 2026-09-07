import type { RespostaCoach, SegmentoLive } from './coach-schema';

export const VALIDADE_ORIENTACAO_MS = 90_000;
export type OrientacaoAnterior = { sugestao: string; trecho_gatilho: string | null };

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function repetida(texto: string, anterior: string): boolean {
  const a = normalizar(texto);
  const b = normalizar(anterior);
  if (a === b) return true;
  const palavras = (valor: string) =>
    new Set(valor.split(' ').filter((palavra) => palavra.length > 3));
  const atuais = palavras(a);
  const passadas = palavras(b);
  const comuns = [...atuais].filter((palavra) => passadas.has(palavra)).length;
  return comuns >= 4 && comuns / Math.max(atuais.size, passadas.size) >= 0.8;
}

/** O modelo propõe; só exibimos uma leitura curta, nova e ancorada na fala recente. */
export function revisarOrientacao(
  resposta: RespostaCoach,
  recentes: readonly SegmentoLive[],
  anteriores: readonly OrientacaoAnterior[],
): RespostaCoach {
  const gatilho = normalizar(resposta.trecho_gatilho);
  const sustentada =
    gatilho.length >= 12 && recentes.some((item) => normalizar(item.texto).includes(gatilho));
  const duplicada = anteriores.some((item) => repetida(resposta.recomendacao, item.sugestao));
  const evidenciaRepetida = anteriores.some((item) => {
    const anterior = normalizar(item.trecho_gatilho ?? '');
    return anterior.length >= 12 && (gatilho.includes(anterior) || anterior.includes(gatilho));
  });
  return {
    ...resposta,
    intervir:
      resposta.intervir &&
      resposta.confianca >= 0.75 &&
      sustentada &&
      !duplicada &&
      !evidenciaRepetida,
  };
}

export function orientacaoVigente<T extends { criada_em: string; status: string }>(
  sugestao: T | null,
  agora = Date.now(),
): T | null {
  if (!sugestao || sugestao.status !== 'nova') return null;
  const idade = agora - Date.parse(sugestao.criada_em);
  return idade >= 0 && idade < VALIDADE_ORIENTACAO_MS ? sugestao : null;
}
