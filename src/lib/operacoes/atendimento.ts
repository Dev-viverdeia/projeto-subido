import { z } from 'zod';

const contagem = z.number().int().nonnegative();
export const ResumoAtendimentoSchema = z.object({
  verificado_em: z.iso.datetime({ offset: true }),
  ia: z.object({
    ativas: contagem,
    expiradas: contagem,
    concluidas: contagem,
    falhas: contagem,
    interrompidas: contagem,
  }),
  entrada: z.object({
    aguardando: contagem,
    atrasadas: contagem,
    revisao: contagem,
    falhas: contagem,
    concluidas: contagem,
  }),
  saida: z.object({
    aguardando: contagem,
    atrasadas: contagem,
    falhas: contagem,
    sem_confirmacao: contagem,
    devolvidas: contagem,
    aceitas: contagem,
    entregues: contagem,
  }),
  pulsos: z.array(
    z.object({
      fase: z.enum(['recebimento', 'envio', 'limpeza']),
      conferido_em: z.iso.datetime({ offset: true }),
      falhou: z.boolean(),
      falhas_seguidas: contagem,
    }),
  ),
});
export type ResumoAtendimento = z.infer<typeof ResumoAtendimentoSchema>;
export type EstadoAtendimento = 'normal' | 'atencao' | 'critico' | 'desconhecido';
export const ESTADOS_ATENDIMENTO = {
  normal: 'Sem alertas',
  atencao: 'Acompanhar',
  critico: 'Ação necessária',
  desconhecido: 'Sem confirmação',
} as const;
export const FASES_SUPORTE = {
  recebimento: 'Receber e-mails',
  envio: 'Enviar respostas',
  limpeza: 'Limpar anexos expirados',
} as const;
export function piorEstado(estados: EstadoAtendimento[]): EstadoAtendimento {
  return estados.includes('critico')
    ? 'critico'
    : estados.includes('desconhecido')
      ? 'desconhecido'
      : estados.includes('atencao')
        ? 'atencao'
        : 'normal';
}
export function avaliarAtendimento(resumo: ResumoAtendimento | null) {
  if (!resumo)
    return {
      nivel: 'desconhecido' as const,
      ia: 'desconhecido' as const,
      entrada: 'desconhecido' as const,
      saida: 'desconhecido' as const,
      verificacoes: [],
    };
  const agora = Date.parse(resumo.verificado_em);
  const verificacoes = Object.entries(FASES_SUPORTE).map(([fase, nome]) => {
    const pulso = resumo.pulsos.find((p) => p.fase === fase);
    const idade = pulso ? (agora - Date.parse(pulso.conferido_em)) / 1000 : null;
    const nivel: EstadoAtendimento =
      !pulso || idade === null || idade < -60
        ? 'desconhecido'
        : idade >= 600 || pulso.falhas_seguidas >= 3
          ? 'critico'
          : idade >= 300 || pulso.falhou
            ? 'atencao'
            : 'normal';
    return {
      fase,
      nome,
      nivel,
      conferido: pulso?.conferido_em ?? null,
      falhas: pulso?.falhas_seguidas ?? 0,
      atrasado: idade !== null && idade >= 300,
    };
  });
  const ia: EstadoAtendimento =
    resumo.ia.expiradas > 0 || resumo.ia.falhas >= 3
      ? 'critico'
      : resumo.ia.falhas + resumo.ia.interrompidas > 0
        ? 'atencao'
        : 'normal';
  const entrada = piorEstado([
    verificacoes[0]!.nivel,
    resumo.entrada.atrasadas > 0 || resumo.entrada.falhas >= 3
      ? 'critico'
      : resumo.entrada.revisao + resumo.entrada.falhas > 0
        ? 'atencao'
        : 'normal',
  ]);
  const saida = piorEstado([
    verificacoes[1]!.nivel,
    resumo.saida.atrasadas > 0 || resumo.saida.falhas >= 3
      ? 'critico'
      : resumo.saida.falhas + resumo.saida.sem_confirmacao + resumo.saida.devolvidas > 0
        ? 'atencao'
        : 'normal',
  ]);
  return {
    nivel: piorEstado([ia, entrada, saida, ...verificacoes.map((p) => p.nivel)]),
    ia,
    entrada,
    saida,
    verificacoes,
  };
}
