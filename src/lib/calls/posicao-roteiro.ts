import type { PlanoCall } from './plano';
import type { TipoCall } from './tipos';

export type PontoRoteiro = {
  momento: 'abertura' | 'perguntas' | 'fechamento';
  indice: number;
};
export type PosicaoRoteiro = PontoRoteiro & { consulta: 'roteiro' | 'ao-vivo' };
export const POSICAO_INICIAL: PosicaoRoteiro = {
  momento: 'perguntas',
  indice: 0,
  consulta: 'roteiro',
};

/** Checksum para invalidar a leitura quando o roteiro muda, não para segurança. */
export function assinaturaRoteiro(plano: PlanoCall | null, tipo: TipoCall): string {
  const conteudo = JSON.stringify([tipo, plano?.abertura, plano?.perguntas, plano?.fechamento]);
  let hash = 2166136261;
  for (let i = 0; i < conteudo.length; i++) {
    hash = Math.imul(hash ^ conteudo.charCodeAt(i), 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function lerPosicaoRoteiro(
  valor: string,
  assinatura: string,
  total: number,
): PosicaoRoteiro {
  try {
    const salvo: unknown = JSON.parse(valor);
    if (!salvo || typeof salvo !== 'object') return POSICAO_INICIAL;
    const p = salvo as Record<string, unknown>;
    if (
      p.versao !== 1 ||
      p.assinatura !== assinatura ||
      (p.momento !== 'abertura' && p.momento !== 'perguntas' && p.momento !== 'fechamento') ||
      (p.consulta !== 'roteiro' && p.consulta !== 'ao-vivo') ||
      typeof p.indice !== 'number' ||
      !Number.isInteger(p.indice) ||
      p.indice < 0 ||
      p.indice >= Math.max(1, total)
    )
      return POSICAO_INICIAL;
    return {
      momento: p.momento,
      indice: p.indice,
      consulta: p.consulta,
    };
  } catch {
    return POSICAO_INICIAL;
  }
}
