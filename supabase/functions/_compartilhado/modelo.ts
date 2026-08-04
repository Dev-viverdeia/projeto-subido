import Anthropic from 'npm:@anthropic-ai/sdk@0.115.0';
import { zodOutputFormat } from 'npm:@anthropic-ai/sdk@0.115.0/helpers/zod';
import { DocumentoSolucao, PerguntasClarificacao, type RespostaClarificacao } from './schema.ts';

/**
 * As duas chamadas ao modelo que o Builder faz — agora em Deno.
 *
 * POR QUE ISTO MORA NUMA EDGE FUNCTION E NÃO NO NEXT
 * Decisão de produto: a chave da Anthropic vive nos secrets do Supabase. Um
 * Route Handler da Vercel lê `process.env` do processo do Next e nunca enxergaria
 * aquele cofre — não é permissão, é endereço. Trazer a geração para cá é o que
 * faz o secret ser efetivamente lido.
 *
 * O PREÇO, DITO POR EXTENSO: o app Next deixa de saber se a chave existe. Antes a
 * tela desabilitava o campo e explicava a pendência ANTES de aceitar a ideia;
 * agora a ausência só aparece na primeira chamada, como erro. É a consequência
 * direta de o segredo sair do alcance de quem desenha a tela.
 *
 * MODELO
 * `claude-opus-5`. O Builder produz o documento que um implementador leva para o
 * cliente — arquitetura, riscos, estimativa. É o uso mais sensível a qualidade de
 * raciocínio da plataforma, e o lugar errado para economizar um degrau de modelo.
 *
 * SAÍDA ESTRUTURADA, NÃO TOOL-USE FORÇADO
 * `output_config.format` constrange a RESPOSTA ao schema. A plataforma de
 * referência força uma tool com `tool_choice` para o mesmo efeito — era o caminho
 * disponível quando ela foi escrita.
 *
 * A VALIDAÇÃO É DO SDK. `zodOutputFormat` guarda o schema Zod dentro do formato e
 * roda o `safeParse` completo ao montar a mensagem final — inclusive os `min`/`max`
 * que o JSON Schema enviado não carrega. Documento com uma etapa só nunca chega
 * em `parsed_output`; vira `AnthropicError`.
 */

/** Fica gravado em cada solução — ver decisão 4 da migration. */
export const MODELO = 'claude-opus-5';

export class ErroDoBuilder extends Error {
  constructor(
    message: string,
    readonly tipo: 'sem-chave' | 'limite' | 'recusa' | 'falha',
  ) {
    super(message);
    this.name = 'ErroDoBuilder';
  }
}

function cliente(): Anthropic {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    throw new ErroDoBuilder(
      'O Builder está sem chave de modelo nos secrets do projeto (ANTHROPIC_API_KEY). ' +
        'Sem ela a geração não roda — e nada aqui vai inventar uma solução para ' +
        'preencher a tela.',
      'sem-chave',
    );
  }
  return new Anthropic({ apiKey });
}

const VOZ = `Você escreve para um IMPLEMENTADOR de IA da Comunidade Subido, que vai
levar este documento para o cliente dele. Não escreve para o cliente final.

Regras de voz, sem exceção:
· Verbo concreto e número específico. Nada de "revolucionar", "transformar",
  "potencializar", "destravar", "game-changer", exclamação ou caixa alta.
· Toda estimativa vem com a premissa que a produziu. Número sem conta é chute com
  aparência de dado.
· Ferramenta é nomeada pelo nome real e pelo papel NESTA solução — não pela
  descrição institucional do produto.
· O que a solução não resolve é parte do documento, não uma ressalva. Um projeto
  sem fronteira escrita vira discussão de escopo na terceira semana.
· Se a ideia não for viável como descrita, diga isso na viabilidade e proponha o
  recorte que é viável. Não finja que dá.`;

/**
 * PRIMEIRA CHAMADA — as perguntas que faltam.
 *
 * Curta de propósito: ela roda de forma SÍNCRONA, dentro do request, e precisa
 * responder bem antes do idle timeout de 150s da plataforma.
 */
export async function gerarPerguntas(ideia: string): Promise<PerguntasClarificacao> {
  const anthropic = cliente();

  try {
    const resposta = await anthropic.messages.parse({
      model: MODELO,
      max_tokens: 4000,
      system: `${VOZ}

Sua tarefa agora NÃO é projetar a solução. É perguntar o que falta para projetá-la.

Faça de 2 a 5 perguntas, cada uma sobre algo que MUDARIA a arquitetura se a
resposta fosse outra: volume, onde o dado mora hoje, quem opera depois de pronto,
qual sistema precisa ser integrado, o que já foi tentado. Nunca pergunte o que a
ideia já respondeu, e nunca peça orçamento ou prazo — isso é conversa comercial,
não insumo de projeto.`,
      messages: [{ role: 'user', content: `Ideia do cliente:\n\n${ideia}` }],
      output_config: { format: zodOutputFormat(PerguntasClarificacao) },
    });

    if (resposta.stop_reason === 'refusal') {
      throw new ErroDoBuilder(
        'O modelo recusou esta ideia. Reescreva descrevendo o processo de negócio a ser automatizado.',
        'recusa',
      );
    }
    if (!resposta.parsed_output) {
      throw new ErroDoBuilder('O modelo não devolveu perguntas na forma esperada.', 'falha');
    }
    return resposta.parsed_output;
  } catch (erro) {
    throw traduzir(erro);
  }
}

/**
 * SEGUNDA CHAMADA — o projeto inteiro.
 *
 * Roda em TAREFA DE FUNDO (ver `builder/gerar.ts`), depois de a resposta HTTP
 * já ter sido devolvida. O teto que vale aqui não é o idle timeout de 150s e sim o
 * wall clock do isolate: 400s no plano pro. A geração leva de 1 a 3 minutos, então
 * a folga é real, mas não é infinita — daí `max_tokens` calibrado e não no talo.
 */
export async function gerarDocumento(
  ideia: string,
  respostas: RespostaClarificacao[],
): Promise<DocumentoSolucao> {
  const anthropic = cliente();

  const entrevista = respostas
    .filter((r) => r.resposta.trim().length > 0)
    .map((r) => `P: ${r.pergunta}\nR: ${r.resposta}`)
    .join('\n\n');

  try {
    /* `.stream()` e não `.create()`: sem streaming a chamada corre contra o
       timeout HTTP do próprio SDK, que é independente dos limites da plataforma. */
    const stream = anthropic.messages.stream({
      model: MODELO,
      /* Somando os `max` do schema, o documento inteiro cabe em ~15k tokens. O
         teto é acima disso porque o pensamento adaptativo também consome
         `max_tokens` — mas não é 64k como na versão da Vercel: aqui existe o wall
         clock de 400s, e teto alto demais é convite para a geração ser cortada
         pelo relógio em vez de terminar. */
      max_tokens: 32000,
      system: `${VOZ}

Sua tarefa é escrever o projeto COMPLETO de implementação.

O que faz este documento valer:
· As ETAPAS são executáveis por quem nunca viu o projeto. "Configurar o webhook"
  não é etapa; "criar o webhook no n8n apontando para o endpoint X e testar com um
  payload de exemplo" é.
· Cada etapa declara sua FASE, e a ordem das fases é a ordem de execução:
    1 · fundação — o que precisa existir antes de qualquer coisa funcionar
        (contas, banco, credenciais, esqueleto)
    2 · construção — o que faz a solução funcionar de verdade
    3 · polimento e lançamento — o que a deixa confiável e no ar
  Toda fase declarada precisa ter pelo menos uma etapa: não pule a 2 nem entregue
  um projeto inteiro na 1.
· Os PROMPTS vêm prontos para colar, escritos para a tarefa específica — não
  modelos genéricos com colchetes para preencher.
· A ARQUITETURA descreve o caminho do dado da entrada até a saída, dizendo onde
  cada ferramenta entra. Em prosa; não desenhe diagrama em texto.
· Os RISCOS são os desta solução, com mitigação concreta. "Pode dar erro" não é
  risco.
· A ECONOMIA é uma conta que o leitor pode refazer a partir das premissas.`,
      messages: [
        {
          role: 'user',
          content: entrevista
            ? `Ideia do cliente:\n\n${ideia}\n\nEntrevista:\n\n${entrevista}`
            : `Ideia do cliente:\n\n${ideia}`,
        },
      ],
      output_config: { format: zodOutputFormat(DocumentoSolucao) },
    });

    const mensagem = await stream.finalMessage();

    if (mensagem.stop_reason === 'refusal') {
      throw new ErroDoBuilder(
        'O modelo recusou gerar este projeto. Reescreva a ideia em termos do processo de negócio a ser automatizado.',
        'recusa',
      );
    }
    if (!mensagem.parsed_output) {
      throw new ErroDoBuilder('O modelo não devolveu documento.', 'falha');
    }
    return mensagem.parsed_output;
  } catch (erro) {
    throw traduzir(erro);
  }
}

/** Erro da API vira mensagem que o implementador entende — nunca stack cru. */
export function traduzir(erro: unknown): ErroDoBuilder {
  if (erro instanceof ErroDoBuilder) return erro;

  if (erro instanceof Anthropic.RateLimitError) {
    return new ErroDoBuilder(
      'O limite de uso do modelo foi atingido. Tente de novo em alguns minutos.',
      'limite',
    );
  }
  if (erro instanceof Anthropic.AuthenticationError) {
    return new ErroDoBuilder(
      'A chave do modelo foi recusada pelo provedor. Confira o secret ANTHROPIC_API_KEY do projeto.',
      'sem-chave',
    );
  }
  if (erro instanceof Anthropic.APIError) {
    return new ErroDoBuilder(`O modelo respondeu com erro ${erro.status}.`, 'falha');
  }
  /* `AnthropicError` que não é `APIError` é falha de validação do schema — na
     prática, documento cortado no meio. A ação certa é tentar de novo, não
     reescrever a ideia. */
  if (erro instanceof Anthropic.AnthropicError) {
    return new ErroDoBuilder(
      'O documento voltou incompleto e não passou na validação. Tente gerar de novo.',
      'falha',
    );
  }
  return new ErroDoBuilder('A geração falhou. Tente de novo.', 'falha');
}
