import { z } from 'zod';

/**
 * O CONTRATO DO BUILDER.
 *
 * Este arquivo é a única definição da forma de uma solução gerada. Ele é usado
 * em três lugares e precisa ser o MESMO nos três:
 *
 *   1. na chamada à API, como schema de SAÍDA ESTRUTURADA — o modelo é obrigado
 *      a responder nesta forma, não pedido gentilmente;
 *   2. na leitura do banco, para estreitar o JSONB de volta ao documento
 *      (`queries.ts`) — é `safeParse`, então documento em formato antigo vira
 *      aviso na tela em vez de estouro no meio de um `.map`;
 *   3. na tela, para tipar o que a ficha renderiza.
 *
 * A coluna `documento` de `builder_solucoes` guarda o resultado. Mudar este
 * arquivo sem migrar as soluções já gravadas quebra a leitura delas — está dito
 * no comment da coluna, no banco.
 *
 * POR QUE SAÍDA ESTRUTURADA E NÃO TOOL-USE FORÇADO
 * A plataforma de referência força uma tool com `tool_choice` para arrancar JSON
 * do modelo — era o caminho disponível quando ela foi escrita. Hoje a API tem
 * `output_config.format`, que constrange a RESPOSTA ao schema em vez de simular
 * uma chamada de ferramenta que nunca executa. Menos indireção, e o erro de forma
 * deixa de ser possível em vez de virar um try/catch de JSON.parse.
 *
 * NOTA SOBRE LIMITES NUMÉRICOS E DE TAMANHO
 * A saída estruturada não suporta `minimum`/`maxLength`/`minItems`: o SDK os
 * remove do JSON Schema enviado e aplica o `safeParse` completo na resposta. Por
 * isso eles continuam valendo — não constrangem a geração, mas reprovam um
 * documento malformado antes de qualquer gravação. Um projeto com uma etapa só
 * nunca chega ao banco.
 */

const Etapa = z.object({
  titulo: z.string().min(1).max(120),
  /** O que fazer, em prosa curta. Não é o prompt — é a instrução ao humano. */
  descricao: z.string().min(1).max(1200),
  /** Ferramentas usadas NESTA etapa, pelo nome. Vazio quando é trabalho manual. */
  ferramentas: z.array(z.string().max(60)).max(8),
});

const Ferramenta = z.object({
  nome: z.string().min(1).max(60),
  /** Para que serve NESTA solução — não a descrição genérica do produto. */
  papel: z.string().min(1).max(400),
  /** 'gratuita' | 'paga' | 'freemium' — o que decide se o cliente topa. */
  custo: z.enum(['gratuita', 'freemium', 'paga']),
});

const Prompt = z.object({
  titulo: z.string().min(1).max(120),
  /** O prompt em si, pronto para colar. É o item que mais justifica o Builder. */
  conteudo: z.string().min(1).max(4000),
});

const Risco = z.object({
  risco: z.string().min(1).max(300),
  mitigacao: z.string().min(1).max(400),
});

/**
 * A estimativa é o número mais perigoso do documento — é o que o implementador
 * leva para a reunião. Por isso ela carrega PREMISSAS obrigatórias: um número
 * sem a conta que o produziu é chute com aparência de dado, e a casa não publica
 * estatística sem fonte.
 */
const Economia = z.object({
  horas_por_mes: z.number().int().min(0).max(720),
  premissas: z.array(z.string().min(1).max(300)).min(1).max(6),
});

export const DocumentoSolucao = z.object({
  titulo: z.string().min(1).max(120),
  /** Uma frase: o que a solução faz, do ponto de vista do cliente. */
  resumo: z.string().min(1).max(400),

  /** Diagnóstico honesto: dá para fazer, e com que ressalva. */
  viabilidade: z.object({
    nivel: z.enum(['direta', 'moderada', 'complexa']),
    justificativa: z.string().min(1).max(800),
  }),

  /** Como as peças se conectam, em prosa. Não é diagrama. */
  arquitetura: z.string().min(1).max(2500),

  ferramentas: z.array(Ferramenta).min(1).max(10),
  etapas: z.array(Etapa).min(3).max(12),
  prompts: z.array(Prompt).max(6),
  riscos: z.array(Risco).min(1).max(6),
  economia: Economia,

  /** O que esta solução NÃO resolve. Ver a nota abaixo. */
  fora_do_escopo: z.array(z.string().min(1).max(300)).min(1).max(6),
});

export type DocumentoSolucao = z.infer<typeof DocumentoSolucao>;

/**
 * `fora_do_escopo` é obrigatório e tem mínimo de 1 DE PROPÓSITO.
 *
 * Um documento que só diz o que a solução faz é material de venda, não projeto.
 * O implementador leva isto para o cliente: sem a fronteira escrita, todo pedido
 * seguinte vira discussão sobre o que estava combinado. É a mesma disciplina do
 * placar imperfeito na tabela comparativa da landing — o limite declarado é o que
 * torna o resto crível.
 */

const PerguntaClarificacao = z.object({
  pergunta: z.string().min(1).max(300),
  /** Por que ela importa. Aparece como dica no wizard. */
  porque: z.string().min(1).max(300),
});

/** Até cinco perguntas: além disso o implementador abandona no meio. */
export const PerguntasClarificacao = z.object({
  perguntas: z.array(PerguntaClarificacao).min(2).max(5),
});

export type PerguntasClarificacao = z.infer<typeof PerguntasClarificacao>;
export type PerguntaClarificacao = z.infer<typeof PerguntaClarificacao>;

/** Uma resposta do wizard, como fica gravada em `builder_solucoes.respostas`. */
export const RespostaClarificacao = PerguntaClarificacao.extend({
  resposta: z.string().max(2000),
});

export type RespostaClarificacao = z.infer<typeof RespostaClarificacao>;

/* ---------------------------------------------------------------------------
 * CORPO DAS REQUISIÇÕES
 *
 * Moram aqui, e não no route handler, porque o cliente monta o corpo e o servidor
 * o valida — é contrato entre os dois, igual ao resto do arquivo. O limite da
 * ideia é o que impede um prompt de tamanho arbitrário chegar à API paga.
 * ------------------------------------------------------------------------- */

/**
 * 4000 caracteres, e o teto é generoso de propósito: os exemplos do compositor
 * são briefings de ~330, e um briefing longo produz um projeto melhor do que
 * cinco perguntas de clarificação conseguiriam recuperar. O limite existe para
 * a chamada paga não ficar sem fronteira, não para economizar caractere.
 */
export const PedidoPerguntas = z.object({
  ideia: z
    .string()
    .trim()
    .min(20, { error: 'Descreva a ideia com um pouco mais de detalhe.' })
    .max(4000),
});

export const PedidoGeracao = z.object({
  id: z.uuid(),
  respostas: RespostaClarificacao.array().max(5),
});
