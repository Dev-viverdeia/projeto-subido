import 'server-only';

import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { chaveDoModelo } from '@/lib/env';
import { DocumentoSolucao, PerguntasClarificacao, type RespostaClarificacao } from './schema';

/**
 * As duas chamadas ao modelo que o Builder faz.
 *
 * MODELO
 * `claude-opus-5`. O Builder produz o documento que um implementador leva para o
 * cliente — arquitetura, riscos, estimativa. É o uso mais sensível a qualidade de
 * raciocínio da plataforma inteira, e o lugar errado para economizar um degrau de
 * modelo.
 *
 * SAÍDA ESTRUTURADA, NÃO TOOL-USE FORÇADO
 * `output_config.format` constrange a RESPOSTA ao schema. A plataforma de
 * referência força uma tool com `tool_choice` para o mesmo efeito — era o caminho
 * disponível quando ela foi escrita. `messages.parse()` devolve o objeto já
 * validado, então não há `JSON.parse` nem try/catch de forma.
 *
 * STREAMING NA GERAÇÃO
 * O documento é longo e a chamada leva dezenas de segundos; sem streaming ela
 * corre contra o timeout HTTP do SDK. `.stream()` + `.finalMessage()` mantém a
 * conexão viva. As perguntas são curtas e não precisam.
 *
 * A VALIDAÇÃO É DO SDK, NÃO NOSSA
 * `zodOutputFormat` guarda o schema Zod DENTRO do formato: ao montar a mensagem
 * final, o SDK roda o `safeParse` completo — inclusive os `min`/`max` que a saída
 * estruturada não suporta e remove do JSON Schema enviado. Um documento com uma
 * etapa só nunca chega em `parsed_output`; vira `AnthropicError`. Por isso não há
 * `JSON.parse` nem revalidação nossa aqui: seria a mesma checagem duas vezes.
 *
 * PENSAMENTO
 * Não passo `thinking`: no Opus 5 ele já vem ligado por padrão. Passar
 * `{type:'disabled'}` para economizar seria trocar a qualidade do raciocínio pelo
 * troco — e ainda esbarraria no teto de effort.
 */

/** Exportado porque fica gravado em cada solução — ver decisão 4 da migration. */
export const MODELO = 'claude-opus-5';

/** Erro que a rota sabe traduzir em mensagem para o implementador. */
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
  const apiKey = chaveDoModelo();
  if (!apiKey) {
    throw new ErroDoBuilder(
      'O Builder ainda não tem chave de modelo configurada (ANTHROPIC_API_KEY). ' +
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
 * O implementador descreve a ideia em uma frase; o que falta para projetar varia
 * por caso. Perguntas fixas gastariam turnos com o que já foi dito e deixariam de
 * fora o que importa naquele caso. Duas a cinco, e o teto é de propósito: acima
 * disso o wizard é abandonado no meio.
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
        'O modelo recusou esta ideia. Reescreva descrevendo o processo de negócio ' +
          'a ser automatizado.',
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
 * Recebe a ideia e as respostas juntas. O schema garante a forma; o que o prompt
 * carrega é o CRITÉRIO — o que faz um documento ser útil em vez de completo.
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
    /* `.stream()` e não `.create()`: o documento é longo e a chamada leva dezenas
       de segundos — sem streaming ela corre contra o timeout HTTP do SDK. */
    const stream = anthropic.messages.stream({
      model: MODELO,
      /* Somando os `max` do schema, o documento inteiro cabe em ~15k tokens. O
         teto é bem acima disso porque o pensamento adaptativo também consome
         `max_tokens`: apertar aqui não deixa a geração mais barata quando ela é
         curta — só corta o documento no meio quando ela é longa. */
      max_tokens: 64000,
      system: `${VOZ}

Sua tarefa é escrever o projeto COMPLETO de implementação.

O que faz este documento valer:
· As ETAPAS são executáveis por quem nunca viu o projeto. "Configurar o webhook"
  não é etapa; "criar o webhook no n8n apontando para o endpoint X e testar com um
  payload de exemplo" é.
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
        'O modelo recusou gerar este projeto. Reescreva a ideia em termos do ' +
          'processo de negócio a ser automatizado.',
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
function traduzir(erro: unknown): ErroDoBuilder {
  if (erro instanceof ErroDoBuilder) return erro;

  if (erro instanceof Anthropic.RateLimitError) {
    return new ErroDoBuilder(
      'O limite de uso do modelo foi atingido. Tente de novo em alguns minutos.',
      'limite',
    );
  }
  if (erro instanceof Anthropic.AuthenticationError) {
    return new ErroDoBuilder(
      'A chave do modelo foi recusada. Verifique a configuração.',
      'sem-chave',
    );
  }
  if (erro instanceof Anthropic.APIError) {
    return new ErroDoBuilder(`O modelo respondeu com erro ${erro.status}.`, 'falha');
  }
  /* `AnthropicError` que NÃO é `APIError` é falha de validação do schema — o SDK
     lança daqui quando o JSON não passa no Zod, o que na prática significa
     documento cortado no meio. Merece frase própria: a ação certa é tentar de
     novo, e não reescrever a ideia. */
  if (erro instanceof Anthropic.AnthropicError) {
    return new ErroDoBuilder(
      'O documento voltou incompleto e não passou na validação. Tente gerar de novo.',
      'falha',
    );
  }
  return new ErroDoBuilder('A geração falhou. Tente de novo.', 'falha');
}
