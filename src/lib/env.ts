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
 * Segredo do Sobral AI. A chave vive apenas no processo do Next e nunca recebe
 * prefixo público; o modelo pode ser trocado por ambiente sem recompilar código.
 */
export function openAIEnv() {
  const parsed = z
    .object({
      OPENAI_API_KEY: z.string().min(20, { error: 'OPENAI_API_KEY está vazia.' }),
      SOBRAL_AI_MODEL: z.string().min(2).default('gpt-5.6-terra'),
      LIVE_COACH_MODEL: z.string().min(2).default('gpt-5.6-luna'),
    })
    .safeParse({
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      SOBRAL_AI_MODEL: process.env.SOBRAL_AI_MODEL,
      LIVE_COACH_MODEL: process.env.LIVE_COACH_MODEL,
    });

  if (!parsed.success) {
    throw new Error(
      'OPENAI_API_KEY ausente. O Sobral AI precisa desse segredo apenas no servidor.',
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
 * OAuth do Google Calendar.
 *
 * A configuração é opcional no boot para não derrubar as Calls quando o Google
 * estiver em manutenção ou durante a rotação de uma credencial. A UI consulta
 * `pronto` antes de oferecer a conexão; tokens de usuários continuam cifrados
 * com uma chave independente do client secret do OAuth.
 */
export function googleCalendarEnv() {
  const parsed = z
    .object({
      GOOGLE_CALENDAR_CLIENT_ID: z.string().min(20),
      GOOGLE_CALENDAR_CLIENT_SECRET: z.string().min(10),
      GOOGLE_CALENDAR_TOKEN_KEY: z.string().refine((valor) => {
        try {
          return Buffer.from(valor, 'base64').byteLength === 32;
        } catch {
          return false;
        }
      }, 'GOOGLE_CALENDAR_TOKEN_KEY precisa conter 32 bytes em base64.'),
    })
    .safeParse({
      GOOGLE_CALENDAR_CLIENT_ID: process.env.GOOGLE_CALENDAR_CLIENT_ID,
      GOOGLE_CALENDAR_CLIENT_SECRET: process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
      GOOGLE_CALENDAR_TOKEN_KEY: process.env.GOOGLE_CALENDAR_TOKEN_KEY,
    });

  return parsed.success ? parsed.data : null;
}

/**
 * Provedores privados da Prospecção.
 *
 * Apify é suficiente para a busca inicial por tipo de empresa e região. SerpAPI
 * amplia a descoberta quando configurada e Firecrawl adiciona contexto do site,
 * mas nenhum dos dois bloqueia o fluxo principal. A configuração continua
 * opcional no boot para o restante da plataforma sobreviver a uma rotação de
 * chave sem reservar créditos em uma busca indisponível.
 */
export function prospeccaoEnv() {
  const dados = {
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
    PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
    APIFY_TOKEN: process.env.APIFY_TOKEN,
    APIFY_PROSPECCAO_ACTOR_ID:
      process.env.APIFY_PROSPECCAO_ACTOR_ID || 'compass/crawler-google-places',
    SERPAPI_API_KEY: process.env.SERPAPI_API_KEY,
    VIA_DATA_GATEWAY_URL: process.env.VIA_DATA_GATEWAY_URL,
    VIA_DATA_GATEWAY_SECRET: process.env.VIA_DATA_GATEWAY_SECRET,
  };

  const firecrawl = z.string().min(10).safeParse(dados.FIRECRAWL_API_KEY);
  const perplexity = z.string().min(10).safeParse(dados.PERPLEXITY_API_KEY);
  const apifyToken = z.string().min(10).safeParse(dados.APIFY_TOKEN);
  const apifyActor = z.string().min(3).safeParse(dados.APIFY_PROSPECCAO_ACTOR_ID);
  const serpApi = z.string().min(10).safeParse(dados.SERPAPI_API_KEY);
  const gateway = z.object({ url: z.url(), segredo: z.string().min(32) }).safeParse({
    url: dados.VIA_DATA_GATEWAY_URL,
    segredo: dados.VIA_DATA_GATEWAY_SECRET,
  });

  return {
    pronto: (apifyToken.success && apifyActor.success) || serpApi.success,
    firecrawl: firecrawl.success ? firecrawl.data : null,
    perplexity: perplexity.success ? perplexity.data : null,
    apifyToken: apifyToken.success ? apifyToken.data : null,
    apifyActor: apifyActor.success ? apifyActor.data : null,
    serpApi: serpApi.success ? serpApi.data : null,
    gateway: gateway.success ? gateway.data : null,
  };
}

/**
 * Destino privado das gravações de Calls.
 *
 * O LiveKit envia o MP3 direto para a API S3 do Supabase. As credenciais são
 * exclusivamente de servidor e a leitura do arquivo continua protegida por RLS.
 * A sala não deixa de funcionar se esta integração estiver incompleta: somente a
 * gravação fica indisponível e a transcrição ao vivo segue normalmente.
 */
export function callRecordingEnv() {
  const parsed = z
    .object({
      SUPABASE_S3_ACCESS_KEY_ID: z.string().min(1),
      SUPABASE_S3_SECRET_ACCESS_KEY: z.string().min(20),
      SUPABASE_S3_SESSION_TOKEN: z.string().min(20),
      SUPABASE_S3_REGION: z.string().min(2),
    })
    .safeParse({
      SUPABASE_S3_ACCESS_KEY_ID: process.env.SUPABASE_S3_ACCESS_KEY_ID,
      SUPABASE_S3_SECRET_ACCESS_KEY: process.env.SUPABASE_S3_SECRET_ACCESS_KEY,
      SUPABASE_S3_SESSION_TOKEN: process.env.SUPABASE_S3_SESSION_TOKEN,
      SUPABASE_S3_REGION: process.env.SUPABASE_S3_REGION,
    });

  return parsed.success
    ? {
        ...parsed.data,
        SUPABASE_S3_ENDPOINT: `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/s3`,
      }
    : null;
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
