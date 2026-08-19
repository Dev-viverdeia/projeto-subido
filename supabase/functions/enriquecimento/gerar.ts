import Anthropic from 'npm:@anthropic-ai/sdk@0.115.0';
import { zodOutputFormat } from 'npm:@anthropic-ai/sdk@0.115.0/helpers/zod';
import OpenAI from 'npm:openai@7.4.0';
import { zodTextFormat } from 'npm:openai@7.4.0/helpers/zod';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.110.9';
import { DossieGerado, DossieGeradoOpenAI, type DossieGerado as Dossie } from './schema.ts';
import { lerPaginaPublica, normalizarSite, type PaginaPublica } from './site.ts';

const MODELO_ANTHROPIC = 'claude-sonnet-5';
const MODELO_OPENAI = 'gpt-5-mini';

const INSTRUCOES_DOSSIE = `Você é o analista de pré-venda da plataforma Subido. Enriqueça a ficha
do cliente para um prestador de serviços de IA vender e implementar um projeto com aderência real.

OBJETIVO DO PRODUTO
· A plataforma conduz o profissional por prospectar, vender e entregar projetos de IA.
· Este enriquecimento precisa preparar uma call comercial específica para esta empresa. Não
  entregue um questionário genérico de consultoria.
· A call deve confirmar uma dor operacional, dimensionar o impacto, conectar o problema a um
  projeto executável e combinar um próximo passo concreto.
· Priorize um projeto principal e, no máximo, duas alternativas entre os projetos ensinados:
  SDR de Atendimento e Qualificação, Máquina de Prospecção B2B, Inteligência Comercial com IA,
  Operação de Conteúdo Multicanal e Radar de Satisfação com IA.

REGRAS INEGOCIÁVEIS
· Fato e hipótese são categorias diferentes. Um dado só entra em "fatos" se
  estiver literalmente nas fontes recebidas. Toda inferência entra em "hipoteses".
· Não invente faturamento, número de funcionários, tecnologia usada, cargo,
  endereço, dor, intenção ou urgência.
· Os dados públicos vindos da Prospecção podem confirmar canais da empresa. Uma pessoa marcada
  como possível decisor continua sendo apenas uma hipótese até ter vínculo e papel confirmados.
· Aproveite telefone, e-mail, site, redes e pessoas já encontradas. Não faça perguntas cuja
  resposta já está literalmente nos dados recebidos.
· Use "alta" apenas quando múltiplos sinais independentes sustentarem a hipótese;
  o normal é "media" ou "baixa".
· Em cada hipótese, diga exatamente como confirmá-la na call.
· Recomende oportunidades de IA específicas para o caso, com mecanismo e impacto;
  nunca prometa resultado e nunca escreva marketing genérico.
· Não pergunte de novo um fato já confirmado nas fontes. Use esse fato para aprofundar a conversa.
· Cada pergunta do roteiro deve nascer de um fato, hipótese ou projeto recomendado; escreva em
  "intencao" o que aquela resposta permite decidir.
· Ordene o roteiro em contexto → processo → impacto → decisão. Inclua perguntas que quantifiquem
  volume, tempo, custo, perda ou capacidade quando a fonte sustentar essa linha de investigação.
· A etapa "decisao" deve descobrir prioridade, responsável pela decisão e condição para um piloto,
  sem pressionar o lead nem assumir orçamento.
· A abertura e a frase de fechamento são falas naturais que o profissional pode usar. Não use
  bajulação, urgência artificial ou afirmação não confirmada.
· O fechamento só recomenda avançar quando houver aderência. Diga qual sinal justifica avançar e
  proponha uma próxima reunião, diagnóstico curto ou piloto compatível com o caso.
· A próxima ação deve ser executável e caber em uma frase.
· Se uma fonte pública falhou ou há pouco contexto, coloque isso em "alertas".
· Escreva em português do Brasil, direto, sem caixa alta ou exclamação.

ORÇAMENTO DOS CAMPOS
· resumo: de 40 a 1.000 caracteres
· empresa: setor até 160; porte, cidade e estado até 120; modelo de negócio até 300
· fatos: até 12; título até 120; valor até 600
· hipóteses: até 8; título até 140; explicação até 700; validação até 500
· oportunidades: até 5; título até 140; impacto e motivo até 500; abertura até 700
· perguntas de descoberta: até 8; devem espelhar as perguntas centrais do roteiro
· roteiro da call: objetivo até 500; abertura até 700; de 4 a 7 perguntas; intenção até 500;
  fechamento com sinal, frase e próximo passo dentro dos limites do schema
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

type CanalEncontrado = {
  tipo:
    | 'telefone'
    | 'email'
    | 'site'
    | 'instagram'
    | 'facebook'
    | 'linkedin'
    | 'x'
    | 'tiktok'
    | 'youtube'
    | 'pinterest';
  valor: string;
  url: string | null;
  origem: 'crm' | 'prospeccao';
};

type PessoaEncontrada = {
  nome: string;
  cargo: string | null;
  email: string | null;
  telefone: string | null;
  linkedinUrl: string | null;
  status: 'confirmada' | 'possivel';
  evidencia: string;
};

type InteligenciaContato = {
  canais: CanalEncontrado[];
  pessoas: PessoaEncontrada[];
};

type DossieCompleto = Dossie & { inteligenciaContato: InteligenciaContato };

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

    if (contexto.prospeccao) {
      fontes.push({ tipo: 'crm', titulo: 'Dados públicos da Prospecção', status: 'lida' });
    }

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
    const completo: DossieCompleto = {
      ...geracao.dossie,
      inteligenciaContato: extrairInteligenciaContato(contexto),
    };
    const seguro = limitarUrls(completo, fontes);
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
      'id, titulo, etapa, origem, valor_centavos, empresa_id, contato_principal_id, proxima_acao, proxima_acao_em, ganha_em, perdida_em, motivo_perda, criado_em, atualizado_em',
    )
    .eq('id', oportunidadeId)
    .single();
  if (error || !oportunidade) throw new Error('oportunidade_nao_encontrada');

  const [empresa, contato, eventos, reunioes, propostas, prospeccao] = await Promise.all([
    supabase
      .from('crm_empresas')
      .select('nome, dominio, setor, porte, cidade, estado, resumo, enriquecimento')
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
    supabase
      .from('propostas')
      .select(
        'titulo, status, apresentada_em, compartilhada_em, primeira_visualizacao_em, ultima_visualizacao_em, visualizacoes, aceita_em, recusada_em, decisao_comentario, atualizado_em',
      )
      .eq('oportunidade_id', oportunidadeId)
      .order('atualizado_em', { ascending: false })
      .limit(6),
    supabase
      .from('prospeccao_leads')
      .select(
        'nome, categoria, endereco, cidade, estado, site_url, dominio, telefone, telefones, emails, redes_sociais, decisores, avaliacao, total_avaliacoes, descricao, fontes, qualificacao',
      )
      .eq('crm_oportunidade_id', oportunidadeId)
      .order('enviado_crm_em', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (empresa.error) throw empresa.error;
  if (contato.error) throw contato.error;
  if (eventos.error) throw eventos.error;
  if (reunioes.error) throw reunioes.error;
  if (propostas.error) throw propostas.error;
  if (prospeccao.error) throw prospeccao.error;

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

  const enriquecimentoEmpresa = objeto(empresa.data?.enriquecimento);
  const prospeccaoDaEmpresa =
    enriquecimentoEmpresa.origem === 'prospeccao' ? enriquecimentoEmpresa : null;

  return {
    oportunidade,
    empresa: empresa.data,
    contato: contato.data,
    eventos: eventos.data ?? [],
    reunioes: reunioes.data ?? [],
    analisesDeCalls: analises.data ?? [],
    propostas: propostas.data ?? [],
    prospeccao: prospeccao.data ?? prospeccaoDaEmpresa,
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
  const roteiro = objeto(raiz.roteiroCall);
  const fechamento = objeto(roteiro.fechamento);

  const hipoteses = lista(raiz.hipoteses, 8).map((item) => {
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
  });
  const oportunidades = lista(raiz.oportunidades, 5).map((item) => {
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
  });
  const perguntasDescoberta = lista(raiz.perguntasDescoberta, 8).map((item) =>
    texto(item, 500, 'Como esse processo funciona hoje?'),
  );
  const proximaAcao = {
    acao: texto(proxima.acao, 500, 'Agendar uma conversa de descoberta com o lead.'),
    porque: texto(
      proxima.porque,
      700,
      'Ainda é preciso confirmar o processo atual antes de desenhar o projeto.',
    ),
  };
  const projetoPrincipal = oportunidades[0]?.titulo ?? null;
  const perguntasRoteiroBrutas = lista(roteiro.perguntas, 7);
  const perguntasFallback = unicas([
    ...oportunidades.map((oportunidade) => oportunidade.abertura),
    ...hipoteses.map((hipotese) => hipotese.comoValidar),
    ...perguntasDescoberta,
    'Quem participa da decisão e o que precisa estar claro para aprovar um piloto?',
  ]).slice(0, 7);
  const basePerguntas =
    perguntasRoteiroBrutas.length >= 4
      ? perguntasRoteiroBrutas
      : perguntasFallback.map((pergunta) => ({ pergunta }));
  const perguntasRoteiro = basePerguntas.map((item, indice) => {
    const pergunta = objeto(item);
    const etapa = enumSeguro(
      pergunta.etapa,
      ['contexto', 'processo', 'impacto', 'decisao'] as const,
      etapaDoRoteiro(indice, basePerguntas.length),
    );
    return {
      etapa,
      pergunta: texto(
        pergunta.pergunta,
        500,
        perguntasFallback[indice] ?? perguntasFallback[0] ?? 'Como esse processo funciona hoje?',
      ),
      intencao: texto(pergunta.intencao, 500, intencaoFallback(etapa, projetoPrincipal)),
      projetoRelacionado:
        pergunta.projetoRelacionado === null
          ? null
          : (textoOuNulo(pergunta.projetoRelacionado, 140) ?? projetoPrincipal),
    };
  });

  const normalizado = {
    resumo: textoComMinimo(
      raiz.resumo,
      40,
      1000,
      'Há pouco contexto confirmado sobre este cliente; use a próxima conversa para completar a ficha.',
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
    hipoteses,
    oportunidades,
    perguntasDescoberta,
    roteiroCall: {
      objetivo: texto(
        roteiro.objetivo,
        500,
        projetoPrincipal
          ? `Confirmar se ${projetoPrincipal} resolve um problema prioritário e merece avançar para um escopo inicial.`
          : 'Confirmar a dor prioritária, o impacto e a condição para avançar com um projeto de IA.',
      ),
      abertura: texto(
        roteiro.abertura,
        700,
        oportunidades[0]?.abertura ?? 'Quero entender como esse processo funciona hoje.',
      ),
      perguntas: perguntasRoteiro,
      fechamento: {
        sinalParaAvancar: texto(
          fechamento.sinalParaAvancar,
          500,
          'Há uma dor confirmada, impacto relevante e alguém responsável por decidir o próximo passo.',
        ),
        frase: texto(
          fechamento.frase,
          700,
          'Pelo que você descreveu, faz sentido organizarmos um escopo inicial e validar o projeto com quem participa da decisão?',
        ),
        proximoPasso: texto(fechamento.proximoPasso, 500, proximaAcao.acao),
      },
    },
    proximaAcao,
    alertas: lista(raiz.alertas, 5).map((item) =>
      texto(item, 500, 'Esta informação precisa ser confirmada.'),
    ),
  };

  return DossieGerado.parse(normalizado);
}

function unicas(valores: string[]): string[] {
  return [...new Set(valores.map((valor) => valor.trim()).filter(Boolean))];
}

function etapaDoRoteiro(
  indice: number,
  total: number,
): 'contexto' | 'processo' | 'impacto' | 'decisao' {
  const proporcao = total > 1 ? indice / (total - 1) : 0;
  if (proporcao < 0.2) return 'contexto';
  if (proporcao < 0.55) return 'processo';
  if (proporcao < 0.82) return 'impacto';
  return 'decisao';
}

function intencaoFallback(
  etapa: 'contexto' | 'processo' | 'impacto' | 'decisao',
  projeto: string | null,
): string {
  if (etapa === 'contexto') return 'Entender o cenário antes de entrar no problema.';
  if (etapa === 'processo') return 'Localizar o gargalo que um projeto de IA precisaria resolver.';
  if (etapa === 'impacto') return 'Dimensionar se a dor justifica investimento e prioridade.';
  return projeto
    ? `Confirmar quem decide e qual condição permite avançar com ${projeto}.`
    : 'Confirmar quem decide e qual condição permite avançar para um escopo inicial.';
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

function limitarUrls(dossie: DossieCompleto, fontes: Fonte[]): DossieCompleto {
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

function extrairInteligenciaContato(contexto: unknown): InteligenciaContato {
  const raiz = objeto(contexto);
  const empresa = objeto(raiz.empresa);
  const contato = objeto(raiz.contato);
  const prospeccao = objeto(raiz.prospeccao);
  const canais: CanalEncontrado[] = [];
  const pessoas: PessoaEncontrada[] = [];
  const vistos = new Set<string>();

  const adicionarCanal = (
    tipo: CanalEncontrado['tipo'],
    valor: unknown,
    url: string | null,
    origem: CanalEncontrado['origem'],
  ) => {
    const limpo = textoOuNulo(valor, 2048);
    if (!limpo) return;
    const chave = `${tipo}:${limpo.toLocaleLowerCase('pt-BR')}`;
    if (vistos.has(chave) || canais.length >= 20) return;
    vistos.add(chave);
    canais.push({ tipo, valor: limpo, url, origem });
  };

  const telefoneCrm = textoOuNulo(contato.telefone, 80);
  const emailCrm = textoOuNulo(contato.email, 320);
  const linkedinCrm = urlOuNula(contato.linkedin_url);
  if (telefoneCrm)
    adicionarCanal('telefone', telefoneCrm, `tel:${somenteDigitos(telefoneCrm)}`, 'crm');
  if (emailCrm) adicionarCanal('email', emailCrm, `mailto:${emailCrm}`, 'crm');
  if (linkedinCrm) adicionarCanal('linkedin', linkedinCrm, linkedinCrm, 'crm');

  const site = urlOuNula(prospeccao.site_url) ?? urlDoDominio(empresa.dominio);
  if (site) adicionarCanal('site', site, site, prospeccao.site_url ? 'prospeccao' : 'crm');

  const telefones = unicas([
    ...strings(prospeccao.telefones),
    textoOuNulo(prospeccao.telefone, 80) ?? '',
  ]);
  for (const telefone of telefones) {
    adicionarCanal('telefone', telefone, `tel:${somenteDigitos(telefone)}`, 'prospeccao');
  }
  for (const email of strings(prospeccao.emails)) {
    adicionarCanal('email', email, `mailto:${email}`, 'prospeccao');
  }
  for (const item of lista(prospeccao.redes_sociais, 16)) {
    const rede = objeto(item);
    const redesPermitidas: ReadonlyArray<CanalEncontrado['tipo']> = [
      'instagram',
      'facebook',
      'linkedin',
      'x',
      'tiktok',
      'youtube',
      'pinterest',
    ];
    const tipo =
      typeof rede.rede === 'string' &&
      redesPermitidas.includes(rede.rede as CanalEncontrado['tipo'])
        ? (rede.rede as CanalEncontrado['tipo'])
        : null;
    const url = urlOuNula(rede.url);
    if (tipo && url) adicionarCanal(tipo, identificadorSocial(url) ?? url, url, 'prospeccao');
  }

  const nomeContato = textoOuNulo(contato.nome, 160);
  if (nomeContato && !/contato a identificar/i.test(nomeContato)) {
    pessoas.push({
      nome: nomeContato,
      cargo: textoOuNulo(contato.cargo, 180),
      email: emailCrm,
      telefone: telefoneCrm,
      linkedinUrl: linkedinCrm,
      status: 'confirmada',
      evidencia: 'Contato cadastrado na ficha do cliente',
    });
  }

  for (const item of lista(prospeccao.decisores, 5)) {
    const decisor = objeto(item);
    const nome = textoOuNulo(decisor.nome, 160);
    if (!nome || pessoas.some((pessoa) => pessoa.nome.toLowerCase() === nome.toLowerCase()))
      continue;
    const email = textoOuNulo(decisor.email, 320);
    const telefone = textoOuNulo(decisor.telefone, 80);
    const linkedinUrl = urlOuNula(decisor.linkedin_url);
    pessoas.push({
      nome,
      cargo: textoOuNulo(decisor.cargo, 180),
      email,
      telefone,
      linkedinUrl,
      status: 'possivel',
      evidencia: texto(decisor.fonte, 120, 'Perfil profissional público'),
    });
    if (email) adicionarCanal('email', email, `mailto:${email}`, 'prospeccao');
    if (telefone)
      adicionarCanal('telefone', telefone, `tel:${somenteDigitos(telefone)}`, 'prospeccao');
    if (linkedinUrl) adicionarCanal('linkedin', nome, linkedinUrl, 'prospeccao');
  }

  return { canais, pessoas: pessoas.slice(0, 6) };
}

function strings(valor: unknown): string[] {
  return Array.isArray(valor)
    ? valor.flatMap((item) => {
        const limpo = textoOuNulo(item, 2048);
        return limpo ? [limpo] : [];
      })
    : [];
}

function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

function urlOuNula(valor: unknown): string | null {
  if (typeof valor !== 'string' || !valor.trim()) return null;
  try {
    const url = new URL(valor.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function urlDoDominio(valor: unknown): string | null {
  const dominio = textoOuNulo(valor, 253);
  if (!dominio) return null;
  return urlOuNula(/^https?:\/\//i.test(dominio) ? dominio : `https://${dominio}`);
}

function identificadorSocial(valor: string): string | null {
  try {
    const partes = new URL(valor).pathname.split('/').filter(Boolean);
    const perfil = partes.at(-1)?.replace(/^@/, '');
    return perfil ? `@${perfil}` : null;
  } catch {
    return null;
  }
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
  return 'Não foi possível enriquecer esta oportunidade agora. Revise os dados e tente novamente.';
}
