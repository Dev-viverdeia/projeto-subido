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
      /* MEDIDO: a `medium` a geração deste briefing levou 165s e 166s em duas
         corridas, contra os 400s de wall clock do isolate — folga de ~2,4×. O
         nível é escolha de orçamento de relógio, não de qualidade: a doc do
         modelo trata `low`/`medium` como níveis fortes, e `high` (o default)
         gastaria pensamento que aqui compete com o teto de tempo. */
      output_config: { effort: 'medium', format: zodOutputFormat(DocumentoSolucao) },
      system: `${VOZ}

Sua tarefa é escrever o projeto COMPLETO de implementação.

ORÇAMENTO DE CADA CAMPO — é contrato, não sugestão. O documento é recusado
inteiro se qualquer um destes for excedido, e você não vê esses limites no
schema:
· titulo até 120 caracteres · resumo até 400 · viabilidade.justificativa até 800
· arquitetura até 2500 caracteres, em prosa
· ferramentas: de 1 a 10, nome até 60, papel até 400
· etapas: de 3 a 12, titulo até 120, descricao até 1200, até 8 ferramentas por etapa
· prompts: até 6, titulo até 120, conteudo até 4000
· riscos: de 1 a 6, risco até 300, mitigacao até 400
· economia.horas_por_mes: inteiro de 0 a 720 · economia.premissas: de 1 a 6, cada uma até 300
· fora_do_escopo: de 1 a 6, cada item até 300

Caber no orçamento é parte da tarefa. Corte o item mais fraco em vez de encurtar
todos até virarem tópico solto — seis riscos escolhidos valem mais que nove
genéricos.

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
    });

    /* Duas coisas são lidas DO STREAM porque depois de `finalMessage()` não dá
       mais: com saída estruturada, um documento que não passa no schema faz o
       próprio SDK lançar na montagem da mensagem final — e aí nem o `stop_reason`
       nem o JSON bruto estão ao alcance.

       `cortadoPorTokens` é guarda para o teto de `max_tokens`, e não é a falha que
       aconteceu nas duas corridas medidas: `stop_reason` veio diferente de
       `max_tokens` nas duas. Fica porque o modo existe e a mensagem dele é outra.

       `bruto` é o que resolve a falha REAL — ver `comDetalheDeSchema`. */
    let cortadoPorTokens = false;
    let bruto = '';
    for await (const evento of stream) {
      if (evento.type === 'message_delta' && evento.delta.stop_reason === 'max_tokens') {
        cortadoPorTokens = true;
      }
      if (evento.type === 'content_block_delta' && evento.delta.type === 'text_delta') {
        bruto += evento.delta.text;
      }
    }

    const mensagem = await stream.finalMessage().catch((erro: unknown) => {
      if (cortadoPorTokens) {
        throw new ErroDoBuilder(
          'O documento estourou o limite de tokens da geração e voltou cortado. Tente de novo; se repetir, encurte a ideia ou as respostas.',
          'falha',
        );
      }
      throw comDetalheDeSchema(erro, bruto);
    });

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

/**
 * DIZ QUAL CAMPO ESTOUROU. É a diferença entre uma falha acionável e um beco.
 *
 * A saída estruturada garante a FORMA — tipos, campos obrigatórios, enums — e não
 * garante os `min`/`max`: o SDK os remove do JSON Schema enviado e só os aplica no
 * `safeParse` da resposta. Consequência medida em duas corridas: o modelo devolve
 * JSON íntegro, com todos os campos, e o documento é recusado por um teto que ele
 * nunca viu. A mensagem genérica ("voltou incompleto e não passou na validação")
 * mandava tentar de novo contra um limite invisível, e a segunda tentativa falhava
 * igual — o `erro` no banco não distinguia isso de JSON truncado.
 *
 * Por isso o JSON bruto é acumulado do stream e reconferido aqui: os `issues` do
 * Zod trazem o CAMINHO do campo, que é justamente o que faltava. São nomes do nosso
 * próprio schema (`arquitetura`, `etapas.4.descricao`) — não é `error.message` cru
 * de PostgREST, é vocabulário desta casa.
 */
function comDetalheDeSchema(erro: unknown, bruto: string): unknown {
  if (!bruto) return erro;

  let json: unknown;
  try {
    json = JSON.parse(bruto);
  } catch {
    /* JSON quebrado de verdade — o genérico está certo neste caso. */
    return erro;
  }

  const conferido = DocumentoSolucao.safeParse(json);
  if (conferido.success) return erro;

  /* `Set` porque um array fora do tamanho gera um issue por item, e a mensagem não
     precisa repetir o mesmo campo seis vezes. */
  const campos = [...new Set(conferido.error.issues.map((i) => i.path.join('.') || '(raiz)'))];
  const mostrados = campos.slice(0, 4).join(', ');
  const resto = campos.length > 4 ? ` e mais ${campos.length - 4}` : '';

  return new ErroDoBuilder(
    `O documento passou do tamanho permitido em: ${mostrados}${resto}. Tente gerar de novo.`,
    'falha',
  );
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
