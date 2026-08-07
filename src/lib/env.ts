/**
 * Único ponto de leitura de `process.env` do projeto.
 *
 * POR QUE ESTE ARQUIVO EXISTE COM ESTE NOME EXATO
 * O passo "Sem credencial hardcoded" do validate-pr.yml roda um grep por
 * `[a-z]{20}.supabase.co` em src/ e exclui exatamente `src/lib/env.ts`. Renomear
 * este arquivo desliga aquele gate em silêncio — o grep passa a não achar nada e
 * o CI fica verde enquanto uma URL vaza em outro lugar.
 *
 * POR QUE AS REFERÊNCIAS SÃO LITERAIS
 * O Next substitui `process.env.NEXT_PUBLIC_X` por uma string no bundle do cliente
 * em tempo de build. A substituição é TEXTUAL: `process.env[nome]` ou um spread de
 * `process.env` não são substituídos e chegam como `undefined` no browser. Por isso
 * cada variável aparece escrita por extenso abaixo, e não num laço.
 */
import { z } from 'zod';

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url({ error: 'NEXT_PUBLIC_SUPABASE_URL precisa ser uma URL.' }),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1, { error: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY está vazia.' }),
  NEXT_PUBLIC_SITE_URL: z.url({ error: 'NEXT_PUBLIC_SITE_URL precisa ser uma URL.' }),
});

/**
 * Falha no boot, não no primeiro request.
 *
 * Um `process.env.X!` espalhado pelo código transforma env faltando num
 * `TypeError: Cannot read properties of undefined` a três stack frames de distância,
 * em produção. Aqui o erro sai na inicialização do módulo, com o nome da variável.
 */
function readPublic() {
  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });

  if (!parsed.success) {
    const detalhe = parsed.error.issues.map((i) => `  · ${i.path.join('.')}: ${i.message}`);
    throw new Error(`Variáveis de ambiente públicas inválidas:\n${detalhe.join('\n')}`);
  }

  return parsed.data;
}

export const env = readPublic();

/**
 * Segredos de servidor.
 *
 * Função, não constante: uma constante seria avaliada na importação, e qualquer
 * componente de cliente que importasse este módulo por causa de `env` quebraria o
 * build. Como função, o segredo só é lido por quem chama — e no cliente
 * `process.env.SUPABASE_SECRET_KEY` é `undefined`, então a chamada falha alto em vez
 * de vazar string vazia para o `createClient`.
 */
export function serverEnv() {
  const parsed = z
    .object({
      SUPABASE_SECRET_KEY: z.string().min(1, { error: 'SUPABASE_SECRET_KEY está vazia.' }),
    })
    .safeParse({ SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY });

  if (!parsed.success) {
    throw new Error(
      'SUPABASE_SECRET_KEY ausente. Este código só roda no servidor — se você viu este ' +
        'erro no browser, um componente de cliente importou o client admin.',
    );
  }

  return parsed.data;
}

/**
 * Credenciais opcionais da infraestrutura de Calls.
 *
 * A agenda e o CRM continuam funcionando sem LiveKit. A sala só tenta emitir um
 * token quando esta função encontra o trio completo no servidor. Isso permite
 * publicar a fundação do produto agora sem aceitar configuração parcial ou fazer
 * qualquer segredo atravessar para o bundle do navegador.
 */
export function livekitEnv() {
  const parsed = z
    .object({
      LIVEKIT_URL: z.url(),
      LIVEKIT_API_KEY: z.string().min(1),
      LIVEKIT_API_SECRET: z.string().min(1),
    })
    .safeParse({
      LIVEKIT_URL: process.env.LIVEKIT_URL,
      LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY,
      LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET,
    });

  return parsed.success ? parsed.data : null;
}

/**
 * NÃO PROCURE A CHAVE DA ANTHROPIC AQUI.
 *
 * Ela vive nos SECRETS DO SUPABASE e é lida por `Deno.env.get` dentro das Edge
 * Functions do Builder (`supabase/functions/builder-*`). Este arquivo lê o
 * ambiente do processo do Next, que nunca enxerga aquele cofre.
 *
 * A consequência, para quem for mexer na tela: o app não tem como saber se a
 * chave existe, então o compositor NÃO desabilita o campo por falta dela. A
 * ausência aparece como erro na primeira chamada, com o nome do secret na
 * mensagem. Uma versão anterior desabilitava o campo lendo `process.env` — se
 * você reencontrar essa ideia, ela só funcionava quando a geração morava na
 * Vercel.
 */
