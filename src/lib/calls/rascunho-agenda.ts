export const CAMPOS_RASCUNHO = [
  'oportunidade',
  'empresa',
  'contato',
  'tipo',
  'titulo',
  'agendadaPara',
  'duracao',
  'convidadoEmail',
  'liveCoach',
] as const;
export type RascunhoAgenda = Partial<Record<(typeof CAMPOS_RASCUNHO)[number], string>>;
export const chaveRascunhoAgenda = (dono: string) => `subido:agenda:rascunho:${dono}`;
export function lerRascunhoAgenda(json: string | null, agora = Date.now()): RascunhoAgenda | null {
  if (!json || json.length > 12_000) return null;
  try {
    const dado = JSON.parse(json) as { salvoEm?: unknown; campos?: unknown };
    if (
      !dado ||
      typeof dado.salvoEm !== 'number' ||
      !Number.isFinite(dado.salvoEm) ||
      agora < dado.salvoEm ||
      agora - dado.salvoEm > 7_200_000 ||
      !dado.campos ||
      typeof dado.campos !== 'object'
    )
      return null;
    const entrada = dado.campos as Record<string, unknown>;
    const campos: RascunhoAgenda = {};
    for (const campo of CAMPOS_RASCUNHO) {
      const valor = entrada[campo];
      if (valor === undefined) continue;
      if (typeof valor !== 'string' || valor.length > 1000) return null;
      campos[campo] = valor;
    }
    return campos;
  } catch {
    return null;
  }
}
