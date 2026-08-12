import Anthropic from 'npm:@anthropic-ai/sdk@0.115.0';
import { zodOutputFormat } from 'npm:@anthropic-ai/sdk@0.115.0/helpers/zod';
import OpenAI from 'npm:openai@7.4.0';
import { zodTextFormat } from 'npm:openai@7.4.0/helpers/zod';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.110.9';
import { DossieGerado, DossieGeradoOpenAI, type DossieGerado as Dossie } from './schema.ts';
import { lerPaginaPublica, normalizarSite, type PaginaPublica } from './site.ts';

const MODELO_ANTHROPIC = 'claude-sonnet-5';
const MODELO_OPENAI = 'gpt-5-mini';

const INSTRUCOES_DOSSIE = `Você é o analista de pré-venda da plataforma Subido. Produza um dossiê
operacional para um prestador de serviços de IA preparar a próxima conversa.

REGRAS INEGOCIÁVEIS
· Fato e hipótese são categorias diferentes. Um dado só entra em "fatos" se
  estiver literalmente nas fontes recebidas. Toda inferência entra em "hipoteses".
· Não invente faturamento, número de funcionários, tecnologia usada, cargo,
  endereço, dor, intenção ou urgência.
· Use "alta" apenas quando múltiplos sinais independentes sustentarem a hipótese;
  o normal é "media" ou "baixa".
· Em cada hipótese, diga exatamente como confirmá-la na call.
· Recomende oportunidades de IA específicas para o caso, com mecanismo e impacto;
  nunca prometa resultado e nunca escreva marketing genérico.
· A abertura é uma frase natural que o profissional pode dizer ao lead. Não use
  bajulação, urgência artificial ou afirmação não confirmada.
· A próxima ação deve ser executável e caber em uma frase.
· Se uma fonte pública falhou ou há pouco contexto, coloque isso em "alertas".
· Escreva em português do Brasil, direto, sem caixa alta ou exclamação.

ORÇAMENTO DOS CAMPOS
· resumo: de 40 a 1.000 caracteres
· empresa: setor até 160; porte, cidade e estado até 120; modelo de negócio até 300
· fatos: até 12; título até 120; valor até 600
· hipóteses: até 8; título até 140; explicação até 700; validação até 500
· oportunidades: até 5; título até 140; impacto e motivo até 500; abertura até 700
· perguntas de descoberta: até 8, cada uma com até 500 caracteres
· próxima ação: ação até 500; motivo até 700
· alertas: até 5, cada um com até 500 caracteres
Respeitar esses limites faz parte da tarefa. Corte o item menos útil antes de
ultrapassar qualquer teto.`;

type Entrada = {
  oportunidade_id: string;
  dominio?: string;
  linkedin_url?: string;
  contexto?: string;
};

type Fonte = {
  tipo: 'crm' | 'site' | 'informado' | 'linkedin';
  titulo: string;
  url?: string;
  status: 'lida' | 'referencia' | 'indisponivel';
};

export async function gerarEGravar(
  supabase: SupabaseClient,
  enriquecimentoId: string,
  entrada: Entrada,
): Promise<void> {
  let etapa = 'iniciar';
  try {
    const inicio = new Date().toISOString();
    const { error: erroInicio } = await supabase
      .from('crm_enriquecimentos')
      .update({ status: 'processando', iniciado_em: inicio, erro: null })
      .eq('id', enriquecimentoId);
    if (erroInicio) throw erroInicio;

    etapa = 'ler_contexto';
    const contexto = await lerContexto(supabase, entrada.oportunidade_id);
    const fontes: Fonte[] = [{ tipo: 'crm', titulo: 'Histórico do CRM', status: 'lida' }];

    let pagina: PaginaPublica | null = null;
    etapa = 'ler_site';
    const site = normalizarSite(entrada.dominio);
    if (site) {
      try {
        pagina = await lerPaginaPublica(site);
        fontes.push({ tipo: 'site', titulo: pagina.titulo, url: pagina.url, status: 'lida' });
      } catch (erro) {
        console.warn('[enriquecimento] site indisponível:', erro);
        fontes.push({
          tipo: 'site',
          titulo: site.hostname,
          url: site.toString(),
          status: 'indisponivel',
        });
      }
    }
    if (entrada.contexto) {
      fontes.push({ tipo: 'informado', titulo: 'Contexto informado', status: 'lida' });
    }
    if (entrada.linkedin_url) {
      fontes.push({
        tipo: 'linkedin',
        titulo: 'Perfil indicado no LinkedIn',
        url: entrada.linkedin_url,
        status: 'referencia',
      });
    }

    etapa = 'gerar_dossie';
    const geracao = await gerarDossieComTolerancia({ contexto, entrada, pagina });
    const seguro = limitarUrls(geracao.dossie, fontes);
    const concluido = new Date().toISOString();

    etapa = 'gravar_resultado';
    const { error } = await supabase
      .from('crm_enriquecimentos')
      .update({
        status: 'concluido',
        resultado: seguro,
        fontes,
        modelo: geracao.modelo,
        concluido_em: concluido,
        erro: null,
      })
      .eq('id', enriquecimentoId);
    if (error) throw error;
  } catch (erro) {
    const tipo =
      erro && typeof erro === 'object' && 'code' in erro
        ? String(erro.code)
        : erro instanceof Error
          ? erro.name
          : 'desconhecido';
    console.error(`[enriquecimento] ${enriquecimentoId} (${etapa}/${tipo}):`, erro);
    const mensagem = mensagemSegura(erro);
    const { error } = await supabase
      .from('crm_enriquecimentos')
      .update({ status: 'falhou', erro: mensagem, concluido_em: new Date().toISOString() })
      .eq('id', enriquecimentoId);
    if (error) console.error('[enriquecimento] falha ao gravar erro:', error);
  }
}

async function lerContexto(supabase: SupabaseClient, oportunidadeId: string) {
  const { data: oportunidade, error } = await supabase
    .from('crm_oportunidades')
    .select(
      'id, titulo, etapa, empresa_id, contato_principal_id, proxima_acao, proxima_acao_em, criado_em',
    )
    .eq('id', oportunidadeId)
    .single();
  if (error || !oportunidade) throw new Error('oportunidade_nao_encontrada');

  const [empresa, contato, eventos, reunioes] = await Promise.all([
    supabase
      .from('crm_empresas')
      .select('nome, dominio, setor, porte, cidade, estado, resumo')
      .eq('id', oportunidade.empresa_id)
      .single(),
    oportunidade.contato_principal_id
      ? supabase
          .from('crm_contatos')
          .select('nome, email, telefone, cargo, linkedin_url')
          .eq('id', oportunidade.contato_principal_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from('crm_eventos')
      .select('tipo, titulo, descricao, dados, ocorrido_em, fonte')
      .eq('oportunidade_id', oportunidadeId)
      .order('ocorrido_em', { ascending: false })
      .limit(40),
    supabase
      .from('calls_reunioes')
      .select('id, titulo, tipo, status, agendada_para')
      .eq('oportunidade_id', oportunidadeId)
      .order('agendada_para', { ascending: false })
      .limit(12),
  ]);

  if (empresa.error) throw empresa.error;
  if (contato.error) throw contato.error;
  if (eventos.error) throw eventos.error;
  if (reunioes.error) throw reunioes.error;

  const ids = (reunioes.data ?? []).map((reuniao) => reuniao.id);
  const analises = ids.length
    ? await supabase
        .from('calls_analises')
        .select(
          'reuniao_id, resumo, dores, objecoes, compromissos, proximos_passos, oportunidades_projeto, sentimento',
        )
        .in('reuniao_id', ids)
        .eq('status', 'concluida')
        .limit(12)
    : { data: [], error: null };
  if (analises.error) throw analises.error;

  return {
    oportunidade,
    empresa: empresa.data,
    contato: contato.data,
    eventos: eventos.data ?? [],
    reunioes: reunioes.data ?? [],
    analisesDeCalls: analises.data ?? [],
  };
}

async function gerarDossie({
  contexto,
  entrada,
  pagina,
}: {
  contexto: unknown;
  entrada: Entrada;
  pagina: PaginaPublica | null;
}): Promise<Dossie> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('sem_chave_modelo');
  const anthropic = new Anthropic({ apiKey });

  const formato = zodOutputFormat(DossieGerado);
  const resposta = await anthropic.messages.create({
    model: MODELO_ANTHROPIC,
    max_tokens: 3500,
    system: INSTRUCOES_DOSSIE,
    messages: [
      {
        role: 'user',
        content:
          `DADOS DO CRM (privados, confirmados pelo histórico):\n${JSON.stringify(contexto)}\n\n` +
          `CONTEXTO INFORMADO PELO PROFISSIONAL:\n${entrada.contexto || 'Não informado.'}\n\n` +
          `LINKEDIN INDICADO (apenas referência; não foi lido):\n${entrada.linkedin_url || 'Não informado.'}\n\n` +
          `CONTEÚDO PÚBLICO DO SITE:\n${pagina ? `URL: ${pagina.url}\n${pagina.texto}` : 'Site não informado ou indisponível.'}`,
      },
    ],
    /* A API continua obrigada a devolver a estrutura do schema. O parser local
       do helper não é usado aqui porque ele recusa o documento inteiro quando
       um único texto excede um limite editorial por poucos caracteres. */
    output_config: { format: { type: formato.type, schema: formato.schema } },
  });

  const bruto = resposta.content
    .filter((bloco) => bloco.type === 'text')
    .map((bloco) => bloco.text)
    .join('')
    .trim();
  if (!bruto) throw new Error('modelo_sem_saida');

  try {
    return normalizarDossie(JSON.parse(bruto));
  } catch {
    throw new Error('modelo_saida_invalida');
  }
}

async function gerarDossieOpenAI(entrada: Parameters<typeof gerarDossie>[0]): Promise<Dossie> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) throw new Error('sem_chave_modelo');
  const openai = new OpenAI({ apiKey, maxRetries: 3, timeout: 45_000 });
  const { contexto, pagina, entrada: pedido } = entrada;

  const resposta = await openai.responses.parse({
    model: MODELO_OPENAI,
    instructions: INSTRUCOES_DOSSIE,
    input:
      `DADOS DO CRM (privados, confirmados pelo histórico):\n${JSON.stringify(contexto)}\n\n` +
      `CONTEXTO INFORMADO PELO PROFISSIONAL:\n${pedido.contexto || 'Não informado.'}\n\n` +
      `LINKEDIN INDICADO (apenas referência; não foi lido):\n${pedido.linkedin_url || 'Não informado.'}\n\n` +
      `CONTEÚDO PÚBLICO DO SITE:\n${pagina ? `URL: ${pagina.url}\n${pagina.texto}` : 'Site não informado ou indisponível.'}`,
    reasoning: { effort: 'low' },
    text: {
      format: zodTextFormat(DossieGeradoOpenAI, 'dossie_lead'),
      verbosity: 'medium',
    },
    max_output_tokens: 3_500,
    store: false,
  });

  if (!resposta.output_parsed) throw new Error('modelo_sem_saida');
  return normalizarDossie(resposta.output_parsed);
}

/** Uma saída inválida recebe uma segunda tentativa no provedor primário. Se o
 * provedor estiver indisponível, a geração continua pela contingência OpenAI. */
async function gerarDossieComTolerancia(
  entrada: Parameters<typeof gerarDossie>[0],
): Promise<{ dossie: Dossie; modelo: string }> {
  try {
    return { dossie: await gerarDossie(entrada), modelo: MODELO_ANTHROPIC };
  } catch (erro) {
    if (!(erro instanceof Anthropic.APIError)) {
      try {
        console.warn('[enriquecimento] primeira saída inválida; repetindo uma vez');
        return { dossie: await gerarDossie(entrada), modelo: MODELO_ANTHROPIC };
      } catch {
        console.warn('[enriquecimento] Anthropic indisponível; usando contingência OpenAI');
        return { dossie: await gerarDossieOpenAI(entrada), modelo: MODELO_OPENAI };
      }
    }
    console.warn('[enriquecimento] Anthropic indisponível; usando contingência OpenAI');
    return { dossie: await gerarDossieOpenAI(entrada), modelo: MODELO_OPENAI };
  }
}

/** O schema do provedor garante campos e tipos; esta camada aplica os limites
 * editoriais sem perder um dossiê inteiro por um texto ligeiramente longo. */
function normalizarDossie(valor: unknown): Dossie {
  const raiz = objeto(valor);
  const empresa = objeto(raiz.empresa);
  const proxima = objeto(raiz.proximaAcao);

  const normalizado = {
    resumo: textoComMinimo(
      raiz.resumo,
      40,
      1000,
      'Há pouco contexto confirmado sobre este lead; use a próxima conversa para completar o diagnóstico.',
    ),
    empresa: {
      setor: textoOuNulo(empresa.setor, 160),
      porte: textoOuNulo(empresa.porte, 120),
      cidade: textoOuNulo(empresa.cidade, 120),
      estado: textoOuNulo(empresa.estado, 120),
      modeloNegocio: textoOuNulo(empresa.modeloNegocio, 300),
    },
    fatos: lista(raiz.fatos, 12).map((item) => {
      const fato = objeto(item);
      return {
        titulo: texto(fato.titulo, 120, 'Fato encontrado'),
        valor: texto(fato.valor, 600, 'Informação registrada nas fontes.'),
        origem: enumSeguro(fato.origem, ['crm', 'site', 'informado'] as const, 'crm'),
        urlFonte: urlOuIndefinida(fato.urlFonte),
      };
    }),
    hipoteses: lista(raiz.hipoteses, 8).map((item) => {
      const hipotese = objeto(item);
      return {
        titulo: texto(hipotese.titulo, 140, 'Hipótese para validar'),
        explicacao: texto(
          hipotese.explicacao,
          700,
          'Esta leitura ainda precisa ser confirmada com o lead.',
        ),
        confianca: enumSeguro(hipotese.confianca, ['alta', 'media', 'baixa'] as const, 'baixa'),
        comoValidar: texto(
          hipotese.comoValidar,
          500,
          'Pergunte diretamente sobre esse ponto na próxima conversa.',
        ),
      };
    }),
    oportunidades: lista(raiz.oportunidades, 5).map((item) => {
      const oportunidade = objeto(item);
      return {
        titulo: texto(oportunidade.titulo, 140, 'Oportunidade de projeto'),
        impacto: texto(
          oportunidade.impacto,
          500,
          'O impacto precisa ser dimensionado após a descoberta.',
        ),
        porQueAgora: texto(
          oportunidade.porQueAgora,
          500,
          'Há um sinal que merece investigação na próxima conversa.',
        ),
        abertura: texto(
          oportunidade.abertura,
          700,
          'Quero entender melhor esse processo antes de sugerir uma solução.',
        ),
      };
    }),
    perguntasDescoberta: lista(raiz.perguntasDescoberta, 8).map((item) =>
      texto(item, 500, 'Como esse processo funciona hoje?'),
    ),
    proximaAcao: {
      acao: texto(proxima.acao, 500, 'Agendar uma conversa de descoberta com o lead.'),
      porque: texto(
        proxima.porque,
        700,
        'Ainda é preciso confirmar o processo atual antes de desenhar o projeto.',
      ),
    },
    alertas: lista(raiz.alertas, 5).map((item) =>
      texto(item, 500, 'Esta informação precisa ser confirmada.'),
    ),
  };

  return DossieGerado.parse(normalizado);
}

function objeto(valor: unknown): Record<string, unknown> {
  return valor && typeof valor === 'object' && !Array.isArray(valor)
    ? (valor as Record<string, unknown>)
    : {};
}

function lista(valor: unknown, maximo: number): unknown[] {
  return Array.isArray(valor) ? valor.slice(0, maximo) : [];
}

function texto(valor: unknown, maximo: number, fallback: string): string {
  const limpo = typeof valor === 'string' ? valor.trim() : '';
  return (limpo || fallback).slice(0, maximo).trim();
}

function textoComMinimo(valor: unknown, minimo: number, maximo: number, fallback: string): string {
  const limpo = texto(valor, maximo, fallback);
  return limpo.length >= minimo ? limpo : fallback.slice(0, maximo);
}

function textoOuNulo(valor: unknown, maximo: number): string | null {
  if (typeof valor !== 'string' || !valor.trim()) return null;
  return valor.trim().slice(0, maximo).trim() || null;
}

function enumSeguro<const T extends readonly string[]>(
  valor: unknown,
  opcoes: T,
  fallback: T[number],
): T[number] {
  return typeof valor === 'string' && opcoes.includes(valor) ? (valor as T[number]) : fallback;
}

function urlOuIndefinida(valor: unknown): string | undefined {
  if (typeof valor !== 'string') return undefined;
  try {
    return new URL(valor).toString();
  } catch {
    return undefined;
  }
}

function limitarUrls(dossie: Dossie, fontes: Fonte[]): Dossie {
  const permitidas = new Set(
    fontes.flatMap((fonte) => (fonte.url && fonte.status === 'lida' ? [fonte.url] : [])),
  );
  return {
    ...dossie,
    fatos: dossie.fatos.map((fato) => ({
      ...fato,
      urlFonte: fato.urlFonte && permitidas.has(fato.urlFonte) ? fato.urlFonte : undefined,
    })),
  };
}

function mensagemSegura(erro: unknown): string {
  if (erro instanceof Error) {
    if (erro.message === 'sem_chave_modelo') {
      return 'A análise por IA ainda não está configurada. Tente novamente mais tarde.';
    }
    if (erro.name === 'AbortError') {
      return 'A fonte pública demorou demais para responder. Revise o site e tente novamente.';
    }
    if (erro.message === 'modelo_sem_saida' || erro.message === 'modelo_saida_invalida') {
      return `A análise voltou fora do formato esperado. [${erro.message}]`;
    }
    if (erro instanceof Anthropic.APIError) {
      return `O provedor da análise respondeu com erro. [api_${erro.status ?? 'desconhecido'}]`;
    }
    if (erro instanceof OpenAI.APIError) {
      return `A contingência da análise respondeu com erro. [api_${erro.status ?? 'desconhecido'}]`;
    }
  }
  return 'Não foi possível montar o dossiê agora. Revise as fontes e tente novamente.';
}
