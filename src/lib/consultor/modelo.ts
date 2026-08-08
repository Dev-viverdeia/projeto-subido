import 'server-only';

import { createHash } from 'node:crypto';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { openAIEnv } from '@/lib/env';
import { contextoParaModelo } from './contexto';
import {
  RespostaEstruturadaSobralSchema,
  type EtapaSobral,
  type RespostaEstruturadaSobral,
  type SinaisSobral,
} from './direcao';

const TETO_HISTORICO = 20;

type MensagemModelo = {
  papel: 'usuario' | 'consultor';
  conteudo: string;
};

export class ErroSobral extends Error {
  constructor(
    message: string,
    readonly tipo: 'sem-chave' | 'limite' | 'recusa' | 'falha',
  ) {
    super(message);
    this.name = 'ErroSobral';
  }
}

export type RodadaSobral = {
  direcao: RespostaEstruturadaSobral;
  modelo: string;
  respostaId: string;
  tokens: number;
};

const INSTRUCOES = `Você é o Sobral AI, o sistema de direção operacional da
plataforma Subido. Você guia profissionais que vendem e implementam projetos de
IA para empresas.

IDENTIDADE E LIMITE
- Sobral AI é o nome do produto. Não diga que você é Pedro Sobral, não invente
  falas dele e não atribua a ele uma opinião que não está nos fatos fornecidos.
- Não prometa renda, venda, resultado ou prazo sem premissa verificável.
- Não substitua orientação jurídica, contábil ou financeira especializada.

COMO VOCÊ DECIDE
- A ETAPA ATUAL já foi calculada pelo sistema a partir de fatos. Aceite-a; nunca
  promova nem rebaixe a pessoa por interpretação própria.
- Diferencie fato registrado, inferência e lacuna. Nunca trate ausência de dado
  como resultado negativo.
- Priorize uma única ação que mova a operação agora. As outras duas devem
  preparar ou proteger esse avanço, não abrir frentes paralelas.
- Toda ação precisa terminar numa evidência observável dentro da plataforma ou
  numa confirmação explícita do cliente.
- Use somente destinos permitidos pelo schema. Não invente telas, recursos,
  integrações ou projetos fora do catálogo recebido.
- Se a pergunta do usuário pede algo específico, responda primeiro e depois
  conecte a resposta à direção operacional. Se faltar contexto decisivo, faça
  uma única pergunta na resposta, mas ainda devolva um próximo passo seguro.

VOZ
- Português do Brasil, direto, próximo e concreto.
- Frases curtas; sem slogans, exclamações, caixa alta ou markdown.
- Evite: revolucionar, transformar, potencializar, destravar, jornada incrível,
  game changer e qualquer elogio genérico.
- Explique o porquê com fatos do contexto, sem parecer um relatório técnico.`;

function identificadorSeguro(usuarioId: string): string {
  return `subido_${createHash('sha256').update(usuarioId).digest('hex').slice(0, 32)}`;
}

export async function gerarRodadaSobral({
  usuarioId,
  etapa,
  sinais,
  historico,
  pedido,
}: {
  usuarioId: string;
  etapa: EtapaSobral;
  sinais: SinaisSobral;
  historico: MensagemModelo[];
  pedido: string;
}): Promise<RodadaSobral> {
  const { OPENAI_API_KEY, SOBRAL_AI_MODEL } = openAIEnv();
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  const contexto = `ETAPA ATUAL FIXA: ${etapa}\n\nFATOS DA OPERAÇÃO:\n${contextoParaModelo(sinais)}`;
  const mensagens = historico.slice(-TETO_HISTORICO).map((mensagem) => ({
    role: mensagem.papel === 'usuario' ? ('user' as const) : ('assistant' as const),
    content: mensagem.conteudo,
  }));

  if (mensagens.length === 0) {
    mensagens.push({ role: 'user', content: pedido });
  }

  try {
    const resposta = await openai.responses.parse({
      model: SOBRAL_AI_MODEL,
      instructions: `${INSTRUCOES}\n\n${contexto}`,
      input: mensagens,
      reasoning: { effort: 'low' },
      text: {
        format: zodTextFormat(RespostaEstruturadaSobralSchema, 'direcao_sobral'),
        verbosity: 'medium',
      },
      max_output_tokens: 3200,
      store: false,
      safety_identifier: identificadorSeguro(usuarioId),
    });

    if (!resposta.output_parsed) {
      const recusou = resposta.output.some(
        (item) => item.type === 'message' && item.status === 'incomplete',
      );
      throw new ErroSobral(
        recusou
          ? 'Não consegui orientar esse pedido. Reescreva descrevendo o processo de negócio.'
          : 'A direção voltou incompleta. Tente atualizar novamente.',
        recusou ? 'recusa' : 'falha',
      );
    }

    const tokens = (resposta.usage?.input_tokens ?? 0) + (resposta.usage?.output_tokens ?? 0);
    return {
      direcao: resposta.output_parsed,
      modelo: SOBRAL_AI_MODEL,
      respostaId: resposta.id,
      tokens,
    };
  } catch (erro) {
    if (erro instanceof ErroSobral) throw erro;
    if (erro instanceof OpenAI.RateLimitError) {
      throw new ErroSobral(
        'O modelo atingiu o limite de uso agora. Tente de novo em alguns minutos.',
        'limite',
      );
    }
    if (erro instanceof OpenAI.AuthenticationError) {
      throw new ErroSobral(
        'A chave do Sobral AI foi recusada. A equipe técnica precisa revisar a configuração.',
        'sem-chave',
      );
    }
    if (erro instanceof OpenAI.APIError) {
      console.error(`[sobral:modelo] OpenAI ${erro.status ?? 'sem-status'}: ${erro.message}`);
      throw new ErroSobral('O Sobral AI não conseguiu responder agora. Tente novamente.', 'falha');
    }

    console.error('[sobral:modelo] falha não classificada:', erro);
    throw new ErroSobral('O Sobral AI não conseguiu responder agora. Tente novamente.', 'falha');
  }
}
