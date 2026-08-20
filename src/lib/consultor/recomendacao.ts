import { z } from 'zod';

export const EventoAcaoCrmSchema = z.object({
  tipo: z.enum(['confirmada', 'remarcada', 'substituida', 'concluida', 'reativada']),
  acao_anterior: z.string().trim().min(3).max(500).nullable(),
  acao_nova: z.string().trim().min(3).max(500),
  quando_anterior: z.string().nullable(),
  quando_novo: z.string().nullable(),
  criado_em: z.string(),
});

export type EventoAcaoCrm = z.infer<typeof EventoAcaoCrmSchema>;

export const RecomendacaoProximaAcaoSchema = z
  .object({
    acao: z.string().trim().min(3).max(500),
    motivo: z.string().trim().min(20).max(1200),
    fatos: z.array(z.string().trim().min(3).max(500)).min(1).max(4),
    quando: z.string().nullable(),
    status: z.enum(['pendente', 'confirmada']),
    modelo: z.string().trim().min(2).max(120),
    gerada_em: z.string(),
    confirmada_em: z.string().nullable(),
  })
  .superRefine((recomendacao, contexto) => {
    if (recomendacao.status === 'confirmada' && !recomendacao.confirmada_em) {
      contexto.addIssue({
        code: 'custom',
        path: ['confirmada_em'],
        message: 'Uma recomendação confirmada precisa registrar quando entrou em Vendas.',
      });
    }
    if (recomendacao.status === 'pendente' && recomendacao.confirmada_em) {
      contexto.addIssue({
        code: 'custom',
        path: ['confirmada_em'],
        message: 'Uma recomendação pendente ainda não pode ter data de confirmação.',
      });
    }
  });

export type RecomendacaoProximaAcao = z.infer<typeof RecomendacaoProximaAcaoSchema>;

export const SaidaRecomendacaoModeloSchema = z.object({
  acao: z.string().trim().min(5).max(220),
  motivo: z.string().trim().min(30).max(700),
  fatos_utilizados: z.array(z.number().int().min(1).max(30)).min(1).max(3),
  prazo_em_dias: z.number().int().min(0).max(60).nullable(),
});

export type SaidaRecomendacaoModelo = z.infer<typeof SaidaRecomendacaoModeloSchema>;

export type FatoDaRecomendacao = {
  id: number;
  fonte: 'CRM' | 'Call' | 'Proposta' | 'Projeto';
  texto: string;
};

export type ContextoRecomendacao = {
  momento: string;
  oportunidadeId: string;
  empresa: string;
  titulo: string;
  etapa: string;
  fatos: FatoDaRecomendacao[];
  proximoPassoDaCall: string | null;
  propostaMaisRecente: string | null;
  callFutura: string | null;
};

export type RecomendacaoGerada = {
  acao: string;
  motivo: string;
  fatos: string[];
  quando: string | null;
  modelo: string;
  respostaId: string | null;
  tokens: number;
};

function rotuloFonte(fonte: FatoDaRecomendacao['fonte']): string {
  if (fonte === 'CRM') return 'Vendas';
  if (fonte === 'Call') return 'Reunião';
  return fonte;
}

function meioDiaNoBrasil(data: Date): string {
  const dia = data.toISOString().slice(0, 10);
  return `${dia}T12:00:00-03:00`;
}

export function prazoDaRecomendacao(momento: string, dias: number | null): string | null {
  if (dias === null) return null;
  const base = new Date(momento);
  if (Number.isNaN(base.getTime())) return null;
  base.setUTCDate(base.getUTCDate() + dias);
  return meioDiaNoBrasil(base);
}

export function resolverFatosUsados(fatos: FatoDaRecomendacao[], ids: number[]): string[] {
  const escolhidos = [...new Set(ids)]
    .map((id) => fatos.find((fato) => fato.id === id))
    .filter((fato): fato is FatoDaRecomendacao => Boolean(fato))
    .slice(0, 3)
    .map((fato) => `${rotuloFonte(fato.fonte)} · ${fato.texto}`);

  if (escolhidos.length > 0) return escolhidos;
  return fatos.slice(0, 3).map((fato) => `${rotuloFonte(fato.fonte)} · ${fato.texto}`);
}

export function criarRecomendacaoFallback(contexto: ContextoRecomendacao): RecomendacaoGerada {
  if (contexto.proximoPassoDaCall) {
    return {
      acao: contexto.proximoPassoDaCall,
      motivo:
        'A reunião já registrou esse compromisso como próximo avanço. Confirmá-lo mantém Vendas alinhado ao que foi combinado com o cliente.',
      fatos: resolverFatosUsados(
        contexto.fatos,
        contexto.fatos.slice(0, 2).map((fato) => fato.id),
      ),
      quando: prazoDaRecomendacao(contexto.momento, 2),
      modelo: 'regra-factual-v2',
      respostaId: null,
      tokens: 0,
    };
  }

  if (contexto.propostaMaisRecente === 'pronta' || contexto.propostaMaisRecente === 'apresentada') {
    return {
      acao: 'Agendar uma conversa de decisão sobre a proposta',
      motivo:
        'A proposta já avançou e a venda está sem próximo compromisso. O movimento mais seguro é conduzir a decisão ao vivo e registrar o resultado.',
      fatos: resolverFatosUsados(
        contexto.fatos,
        contexto.fatos.slice(0, 2).map((fato) => fato.id),
      ),
      quando: prazoDaRecomendacao(contexto.momento, 2),
      modelo: 'regra-factual-v2',
      respostaId: null,
      tokens: 0,
    };
  }

  if (contexto.callFutura) {
    return {
      acao: 'Preparar as perguntas e critérios da próxima reunião',
      motivo:
        'Já existe uma conversa marcada. Preparar as lacunas e os critérios de decisão evita abrir uma frente paralela antes desse compromisso.',
      fatos: resolverFatosUsados(
        contexto.fatos,
        contexto.fatos.slice(0, 2).map((fato) => fato.id),
      ),
      quando: contexto.callFutura,
      modelo: 'regra-factual-v2',
      respostaId: null,
      tokens: 0,
    };
  }

  return {
    acao: 'Revisar o histórico e combinar o próximo compromisso com o cliente',
    motivo:
      'A ação anterior terminou e ainda não há outro compromisso registrado. O próximo passo deve fechar a principal lacuna do lead antes de produzir novo escopo.',
    fatos: resolverFatosUsados(
      contexto.fatos,
      contexto.fatos.slice(0, 2).map((fato) => fato.id),
    ),
    quando: prazoDaRecomendacao(contexto.momento, 2),
    modelo: 'regra-factual-v2',
    respostaId: null,
    tokens: 0,
  };
}
