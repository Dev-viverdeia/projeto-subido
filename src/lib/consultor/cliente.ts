import { z } from 'zod';

export const FonteClienteSchema = z.enum([
  'Cadastro',
  'Pesquisa',
  'Histórico',
  'Reunião',
  'Proposta',
  'Entrega',
  'Tarefa',
]);

export const FichaConsultadaSchema = z.object({
  oportunidadeId: z.uuid(),
  empresa: z.string().max(160),
  consultadaEm: z.string(),
  fontes: z
    .array(
      z.object({
        nome: FonteClienteSchema,
        registros: z.number().int().positive(),
        atualizadaEm: z.string().nullable(),
      }),
    )
    .max(7),
  incompleta: z.boolean(),
});

export const ClienteSobralSchema = z.object({
  estado: z.enum(['sem_cliente', 'ambiguo', 'consultado', 'indisponivel']),
  opcoes: z.array(z.string().max(340)).max(4),
  ficha: FichaConsultadaSchema.nullable(),
  fatos: z
    .array(
      z.object({
        fonte: FonteClienteSchema,
        natureza: z.enum(['registro', 'hipotese']),
        texto: z.string().max(500),
        data: z.string().nullable(),
      }),
    )
    .max(32),
});

export type ClienteSobral = z.infer<typeof ClienteSobralSchema>;
export type FichaConsultada = z.infer<typeof FichaConsultadaSchema>;

export function textoCliente(valor: unknown, limite = 380): string | null {
  if (typeof valor !== 'string') return null;
  const texto = valor.replace(/\s+/g, ' ').trim();
  return texto ? texto.slice(0, limite) : null;
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Resposta curta à escolha entre oportunidades; não basta mencionar o título
 * dentro de outro pedido (por exemplo, estudar um projeto com o mesmo nome). */
export function confirmaNome(pedido: string, nome: string): boolean {
  return (
    normalizar(pedido).replace(/^(a oportunidade |o projeto |a |o |quero |essa |esse )/, '') ===
    normalizar(nome).replace(/^(a |o )/, '')
  );
}

/** Nomes completos e limites de palavra; nunca uma busca aproximada por segmento. */
export function mencionados<T extends { nome: string }>(texto: string, itens: T[]): T[] {
  const pedido = ` ${normalizar(texto)} `;
  const encontrados = itens.filter((item) => {
    const nome = normalizar(item.nome);
    return nome.length >= 3 && pedido.includes(` ${nome} `);
  });
  // "Aurora" não ganha de "Clínica Aurora", mas homônimos continuam ambíguos.
  return encontrados
    .filter(
      (item) =>
        !encontrados.some(
          (outro) =>
            normalizar(outro.nome) !== normalizar(item.nome) &&
            ` ${normalizar(outro.nome)} `.includes(` ${normalizar(item.nome)} `),
        ),
    )
    .filter((item) => {
      const inicio = pedido.indexOf(` ${normalizar(item.nome)} `);
      const antes = pedido.slice(Math.max(0, inicio - 40), inicio);
      return !/\b(nao e|nao da|nao do|ignore|ignorar|desconsidere|esqueca)( a| o)?$/.test(
        antes.trim(),
      );
    });
}

/** Só retoma um nome dito pelo usuário quando há referência explícita ao cliente.
 * Respostas da IA e pedidos genéricos não escolhem uma ficha silenciosamente. */
export function empresasDoPedido<T extends { nome: string }>(
  pedido: string,
  historico: { papel: string; conteudo: string }[],
  empresas: T[],
): T[] {
  const atuais = mencionados(pedido, empresas);
  if (atuais.length) return atuais;
  const texto = normalizar(pedido);
  if (/\b(outro|outra|novo cliente|nova empresa|mudar de assunto)\b/.test(texto)) return [];
  if (
    !/\b(esse cliente|essa empresa|dessa empresa|desse cliente|dele|dela|para eles|para elas|essa proposta|essa entrega)\b/.test(
      texto,
    )
  )
    return [];
  for (const mensagem of historico
    .filter((item) => item.papel === 'usuario')
    .slice(-6)
    .reverse()) {
    if (mensagem.conteudo === pedido) continue;
    const anteriores = mencionados(mensagem.conteudo, empresas);
    // O primeiro cliente citado é a única retomada possível; não atravessa ambiguidades.
    if (anteriores.length) return anteriores;
    if (
      !/\b(esse cliente|essa empresa|dessa empresa|desse cliente|dele|dela|para eles|para elas|essa proposta|essa entrega)\b/.test(
        normalizar(mensagem.conteudo),
      )
    )
      break;
  }
  return [];
}
