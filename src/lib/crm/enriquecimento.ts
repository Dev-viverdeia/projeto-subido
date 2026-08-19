import { z } from 'zod';
import type { Enums, Json } from '@/lib/supabase/types.generated';

const DossieSchema = z.object({
  resumo: z.string(),
  empresa: z.object({
    setor: z.string().nullable(),
    porte: z.string().nullable(),
    cidade: z.string().nullable(),
    estado: z.string().nullable(),
    modeloNegocio: z.string().nullable(),
  }),
  fatos: z.array(
    z.object({
      titulo: z.string(),
      valor: z.string(),
      origem: z.enum(['crm', 'site', 'informado']),
      urlFonte: z.url().optional(),
    }),
  ),
  hipoteses: z.array(
    z.object({
      titulo: z.string(),
      explicacao: z.string(),
      confianca: z.enum(['alta', 'media', 'baixa']),
      comoValidar: z.string(),
    }),
  ),
  oportunidades: z.array(
    z.object({
      titulo: z.string(),
      impacto: z.string(),
      porQueAgora: z.string(),
      abertura: z.string(),
    }),
  ),
  perguntasDescoberta: z.array(z.string()),
  roteiroCall: z
    .object({
      objetivo: z.string(),
      abertura: z.string(),
      perguntas: z.array(
        z.object({
          etapa: z.enum(['contexto', 'processo', 'impacto', 'decisao']),
          pergunta: z.string(),
          intencao: z.string(),
          projetoRelacionado: z.string().nullable(),
        }),
      ),
      fechamento: z.object({
        sinalParaAvancar: z.string(),
        frase: z.string(),
        proximoPasso: z.string(),
      }),
    })
    .optional(),
  inteligenciaContato: z
    .object({
      canais: z.array(
        z.object({
          tipo: z.enum([
            'telefone',
            'email',
            'site',
            'instagram',
            'facebook',
            'linkedin',
            'x',
            'tiktok',
            'youtube',
            'pinterest',
          ]),
          valor: z.string(),
          url: z.string().nullable(),
          origem: z.enum(['crm', 'prospeccao']),
        }),
      ),
      pessoas: z.array(
        z.object({
          nome: z.string(),
          cargo: z.string().nullable(),
          email: z.string().nullable(),
          telefone: z.string().nullable(),
          linkedinUrl: z.string().nullable(),
          status: z.enum(['confirmada', 'possivel']),
          evidencia: z.string(),
        }),
      ),
    })
    .optional(),
  proximaAcao: z.object({ acao: z.string(), porque: z.string() }),
  alertas: z.array(z.string()),
});

const FonteSchema = z.object({
  tipo: z.enum(['crm', 'site', 'informado', 'linkedin']),
  titulo: z.string(),
  url: z.url().optional(),
  status: z.enum(['lida', 'referencia', 'indisponivel']),
});

export type DossieEnriquecido = z.infer<typeof DossieSchema>;
export type FonteEnriquecimento = z.infer<typeof FonteSchema>;
export type StatusEnriquecimento = Enums<'crm_enriquecimento_status'>;
export type RoteiroCall = NonNullable<DossieEnriquecido['roteiroCall']>;

export function lerDossie(valor: Json | null): DossieEnriquecido | null {
  const resultado = DossieSchema.safeParse(valor);
  return resultado.success ? resultado.data : null;
}

export function lerFontes(valor: Json): FonteEnriquecimento[] {
  const resultado = FonteSchema.array().safeParse(valor);
  return resultado.success ? resultado.data : [];
}

export const ROTULO_CONFIANCA: Record<DossieEnriquecido['hipoteses'][number]['confianca'], string> =
  {
    alta: 'Confiança alta',
    media: 'Confiança média',
    baixa: 'Confiança baixa',
  };

export const ROTULO_ORIGEM: Record<DossieEnriquecido['fatos'][number]['origem'], string> = {
  crm: 'CRM',
  site: 'Site público',
  informado: 'Informado por você',
};

export const ROTULO_ETAPA_CALL: Record<RoteiroCall['perguntas'][number]['etapa'], string> = {
  contexto: 'Abrir',
  processo: 'Entender',
  impacto: 'Dimensionar',
  decisao: 'Avançar',
};

/** Enriquecimentos anteriores ao roteiro estruturado continuam úteis. A
 * adaptação prioriza perguntas ligadas às hipóteses e aos projetos, deixando o
 * questionário genérico apenas como complemento. */
export function obterRoteiroCall(dossie: DossieEnriquecido): RoteiroCall {
  if (dossie.roteiroCall) return dossie.roteiroCall;

  const projetoPrincipal = dossie.oportunidades[0]?.titulo ?? null;
  const candidatas = [
    ...dossie.oportunidades.slice(0, 2).map((oportunidade) => ({
      etapa: 'processo' as const,
      pergunta: oportunidade.abertura,
      intencao: `Validar se ${oportunidade.titulo} resolve um problema concreto desta empresa.`,
      projetoRelacionado: oportunidade.titulo,
    })),
    ...dossie.hipoteses.slice(0, 2).map((hipotese) => ({
      etapa: 'processo' as const,
      pergunta: hipotese.comoValidar,
      intencao: `Confirmar ou descartar a hipótese: ${hipotese.titulo}.`,
      projetoRelacionado: projetoPrincipal,
    })),
    ...dossie.perguntasDescoberta.map((pergunta) => {
      const etapa = classificarPergunta(pergunta);
      return {
        etapa,
        pergunta,
        intencao: intencaoDaEtapa(etapa, projetoPrincipal),
        projetoRelacionado: etapa === 'contexto' ? null : projetoPrincipal,
      };
    }),
  ];
  const perguntas = candidatas
    .filter(
      (item, indice, itens) =>
        itens.findIndex(
          (candidata) =>
            candidata.pergunta.trim().toLowerCase() === item.pergunta.trim().toLowerCase(),
        ) === indice,
    )
    .sort((a, b) => ORDEM_ETAPA[a.etapa] - ORDEM_ETAPA[b.etapa])
    .slice(0, 6);

  if (!perguntas.some((pergunta) => pergunta.etapa === 'contexto')) {
    perguntas.unshift({
      etapa: 'contexto',
      pergunta: 'Qual resultado mais importante você quer melhorar nesse processo?',
      intencao: 'Entender o resultado que deve orientar a conversa.',
      projetoRelacionado: null,
    });
  }
  if (!perguntas.some((pergunta) => pergunta.etapa === 'processo')) {
    perguntas.splice(1, 0, {
      etapa: 'processo',
      pergunta: 'Como esse processo acontece hoje, do início ao fim?',
      intencao: 'Localizar o gargalo que um projeto de IA precisaria resolver.',
      projetoRelacionado: projetoPrincipal,
    });
  }
  if (!perguntas.some((pergunta) => pergunta.etapa === 'impacto')) {
    perguntas.splice(Math.max(1, perguntas.length - 1), 0, {
      etapa: 'impacto',
      pergunta: 'Quanto esse gargalo custa hoje em tempo, capacidade ou oportunidades perdidas?',
      intencao: 'Dimensionar se a dor justifica prioridade e investimento.',
      projetoRelacionado: projetoPrincipal,
    });
  }
  if (!perguntas.some((pergunta) => pergunta.etapa === 'decisao')) {
    perguntas.push({
      etapa: 'decisao',
      pergunta:
        'Quem precisa participar da decisão e o que deve estar claro para aprovar um piloto?',
      intencao: 'Definir o caminho real para a oportunidade avançar.',
      projetoRelacionado: projetoPrincipal,
    });
  }
  perguntas.sort((a, b) => ORDEM_ETAPA[a.etapa] - ORDEM_ETAPA[b.etapa]);

  return {
    objetivo: projetoPrincipal
      ? `Confirmar se ${projetoPrincipal} resolve uma dor prioritária e merece avançar para um escopo inicial.`
      : 'Confirmar a dor prioritária, o impacto e a condição para avançar com um projeto de IA.',
    abertura: projetoPrincipal
      ? `Quero entender melhor como esse processo funciona hoje e avaliar, com você, se ${projetoPrincipal} faz sentido para esta operação.`
      : 'Quero entender o processo atual antes de sugerir qualquer projeto de IA.',
    perguntas: perguntas.slice(0, 7),
    fechamento: {
      sinalParaAvancar:
        'Há uma dor confirmada, impacto relevante e alguém responsável por decidir o próximo passo.',
      frase:
        'Pelo que você descreveu, faz sentido organizarmos um escopo inicial e validar esse projeto com quem participa da decisão?',
      proximoPasso: dossie.proximaAcao.acao,
    },
  };
}

const ORDEM_ETAPA: Record<RoteiroCall['perguntas'][number]['etapa'], number> = {
  contexto: 0,
  processo: 1,
  impacto: 2,
  decisao: 3,
};

function classificarPergunta(pergunta: string): RoteiroCall['perguntas'][number]['etapa'] {
  const texto = pergunta.toLocaleLowerCase('pt-BR');
  if (/decis|aprova|orçamento|invest|prioridade|piloto|prazo/.test(texto)) return 'decisao';
  if (/quanto|quant|volume|tempo|custo|perd|taxa|fila|atras|capacidade/.test(texto)) {
    return 'impacto';
  }
  if (/nome|cargo|objetivo|responsável/.test(texto)) return 'contexto';
  return 'processo';
}

function intencaoDaEtapa(
  etapa: RoteiroCall['perguntas'][number]['etapa'],
  projeto: string | null,
): string {
  if (etapa === 'contexto')
    return 'Entender quem participa e qual resultado importa nesta conversa.';
  if (etapa === 'processo') return 'Localizar o gargalo que um projeto de IA precisaria resolver.';
  if (etapa === 'impacto') return 'Dimensionar se a dor justifica prioridade e investimento.';
  return projeto
    ? `Confirmar a condição para avançar com ${projeto}.`
    : 'Confirmar a condição para avançar com um escopo inicial.';
}
