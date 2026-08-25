export type CriteriosCertificado = {
  aprendizadoIds: string[];
  implementacaoIds: string[];
};

export type RegistrosCertificado = {
  aprendizado: Record<string, string>;
  implementacao: Record<string, string>;
};

type GrupoCertificado = {
  feitas: number;
  total: number;
  concluido: boolean;
};

export type EstadoCertificado = {
  aprendizado: GrupoCertificado;
  implementacao: GrupoCertificado;
  feitas: number;
  total: number;
  percentual: number;
  concluido: boolean;
  iniciado: boolean;
  concluidoEm: string | null;
};

function avaliarGrupo(ids: string[], registro: Record<string, string>): GrupoCertificado {
  const feitas = ids.reduce((total, id) => total + (registro[id] ? 1 : 0), 0);
  return {
    feitas,
    total: ids.length,
    concluido: ids.length === 0 || feitas === ids.length,
  };
}

/**
 * Regra única da certificação. Formação exige suas aulas; projeto exige as
 * aulas do minicurso e todos os passos da implementação guiada.
 */
export function avaliarCertificado(
  criterios: CriteriosCertificado,
  registros: RegistrosCertificado,
): EstadoCertificado {
  const aprendizado = avaliarGrupo(criterios.aprendizadoIds, registros.aprendizado);
  const implementacao = avaliarGrupo(criterios.implementacaoIds, registros.implementacao);
  const feitas = aprendizado.feitas + implementacao.feitas;
  const total = aprendizado.total + implementacao.total;
  const datas = [
    ...criterios.aprendizadoIds.map((id) => registros.aprendizado[id]),
    ...criterios.implementacaoIds.map((id) => registros.implementacao[id]),
  ].filter((data): data is string => Boolean(data));

  return {
    aprendizado,
    implementacao,
    feitas,
    total,
    percentual: total > 0 ? Math.round((feitas / total) * 100) : 0,
    concluido: total > 0 && aprendizado.concluido && implementacao.concluido,
    iniciado: feitas > 0,
    concluidoEm: datas.sort().at(-1) ?? null,
  };
}
