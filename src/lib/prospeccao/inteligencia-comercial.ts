import 'server-only';

import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { openAIEnv } from '@/lib/env';
import type { LeadProspeccaoEntrada } from './schema';

const ProjetoSchema = z.enum([
  'sdr-atendimento-qualificacao',
  'maquina-prospeccao-b2b',
  'inteligencia-comercial-com-ia',
  'operacao-conteudo-multicanal',
  'radar-satisfacao-com-ia',
]);

const TITULOS = {
  'sdr-atendimento-qualificacao': 'SDR de Atendimento e Qualificação',
  'maquina-prospeccao-b2b': 'Máquina de Prospecção B2B',
  'inteligencia-comercial-com-ia': 'Inteligência Comercial com IA',
  'operacao-conteudo-multicanal': 'Operação de Conteúdo Multicanal',
  'radar-satisfacao-com-ia': 'Radar de Satisfação com IA',
} as const;

const AnaliseSchema = z.object({
  analises: z.array(
    z.object({
      chave: z.string().min(1).max(500),
      projeto_slug: ProjetoSchema,
      motivo: z.string().min(1).max(240),
      pergunta_abertura: z.string().min(1).max(240),
      melhor_canal: z.enum(['whatsapp', 'telefone', 'email', 'linkedin', 'instagram']),
      confianca: z.enum(['alta', 'media', 'inicial']),
      evidencias: z.array(z.string().min(1).max(180)).max(4),
    }),
  ),
});

type Analise = z.infer<typeof AnaliseSchema>['analises'][number];

function textoBase(lead: LeadProspeccaoEntrada) {
  return [lead.categoria, lead.descricao, lead.dados.site_resumo]
    .filter((valor): valor is string => typeof valor === 'string')
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

function melhorCanal(lead: LeadProspeccaoEntrada): Analise['melhor_canal'] {
  const decisor = lead.decisores.find((item) => item.email || item.telefone || item.linkedin_url);
  if (decisor?.telefone || lead.telefones.length || lead.telefone) return 'whatsapp';
  if (decisor?.email || lead.emails.length) return 'email';
  if (decisor?.linkedin_url || lead.redes_sociais.some((item) => item.rede === 'linkedin')) {
    return 'linkedin';
  }
  return lead.redes_sociais.some((item) => item.rede === 'instagram') ? 'instagram' : 'telefone';
}

function evidenciaBase(lead: LeadProspeccaoEntrada) {
  const evidencias = [
    lead.categoria ? `Atuação pública: ${lead.categoria}` : null,
    lead.total_avaliacoes
      ? `${lead.total_avaliacoes} avaliações públicas${lead.avaliacao ? `, nota ${lead.avaliacao}` : ''}`
      : null,
    lead.decisores.length ? 'Possível decisor identificado em fonte profissional' : null,
    lead.site_url ? 'Site oficial encontrado' : null,
  ];
  return evidencias.filter((item): item is string => Boolean(item)).slice(0, 4);
}

function analiseDeterministica(lead: LeadProspeccaoEntrada): Analise {
  const base = textoBase(lead);
  let projeto: z.infer<typeof ProjetoSchema> = 'sdr-atendimento-qualificacao';
  let motivo =
    'A operação atende clientes e pode ganhar velocidade ao responder, qualificar e encaminhar contatos com contexto.';
  let pergunta =
    'Como vocês recebem e distribuem hoje os novos contatos que chegam pelo WhatsApp ou pelo site?';

  if (/agencia|marketing|publicidade|consultoria comercial|vendas/.test(base)) {
    projeto = 'inteligencia-comercial-com-ia';
    motivo =
      'A empresa aparenta vender por conversa e pode reduzir perda de contexto entre reunião, follow-up e proposta.';
    pergunta =
      'Depois de uma reunião comercial, como vocês registram os fatos e garantem que o follow-up saia no prazo?';
  } else if (/software|tecnologia|industrial|industria|logistica|atacado|distribui/.test(base)) {
    projeto = 'maquina-prospeccao-b2b';
    motivo =
      'O perfil parece B2B e pode se beneficiar de uma rotina que encontra contas, decisores e contatos com evidências.';
    pergunta =
      'Como o time encontra hoje novas empresas e a pessoa certa para iniciar uma conversa comercial?';
  } else if (/educa|curso|escola|midia|conteudo|creator|comunicacao/.test(base)) {
    projeto = 'operacao-conteudo-multicanal';
    motivo =
      'A operação depende de conhecimento e presença digital, cenário em que um fluxo de conteúdo com revisão humana tende a gerar eficiência.';
    pergunta =
      'Como vocês transformam conhecimento da equipe em conteúdo recorrente sem travar a revisão e a aprovação?';
  } else if ((lead.total_avaliacoes ?? 0) >= 120) {
    projeto = 'radar-satisfacao-com-ia';
    motivo =
      'O volume de avaliações indica uma base relevante de clientes e espaço para acompanhar satisfação e agir sobre comentários críticos.';
    pergunta =
      'Como vocês acompanham hoje a satisfação dos clientes e identificam rapidamente quem precisa de retorno?';
  }

  return {
    chave: lead.chave_externa,
    projeto_slug: projeto,
    motivo,
    pergunta_abertura: pergunta,
    melhor_canal: melhorCanal(lead),
    confianca: evidenciaBase(lead).length >= 3 ? 'media' : 'inicial',
    evidencias: evidenciaBase(lead),
  };
}

function aplicarAnalise(lead: LeadProspeccaoEntrada, analise: Analise): LeadProspeccaoEntrada {
  return {
    ...lead,
    qualificacao: {
      ...lead.qualificacao,
      oportunidade: {
        projeto_slug: analise.projeto_slug,
        projeto_titulo: TITULOS[analise.projeto_slug],
        motivo: analise.motivo,
        pergunta_abertura: analise.pergunta_abertura,
        melhor_canal: analise.melhor_canal,
        confianca: analise.confianca,
        evidencias: analise.evidencias,
      },
    },
  };
}

export async function analisarOportunidadesDeProjeto(
  leads: LeadProspeccaoEntrada[],
): Promise<{ leads: LeadProspeccaoEntrada[]; modo: 'ia' | 'regras' }> {
  const fallback = new Map(leads.map((lead) => [lead.chave_externa, analiseDeterministica(lead)]));
  if (!leads.length) return { leads, modo: 'regras' };

  try {
    const { OPENAI_API_KEY, LIVE_COACH_MODEL } = openAIEnv();
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY, maxRetries: 1, timeout: 45_000 });
    const entrada = leads.map((lead) => ({
      chave: lead.chave_externa,
      nome: lead.nome,
      categoria: lead.categoria,
      cidade: lead.cidade,
      descricao_publica: lead.descricao,
      resumo_site: typeof lead.dados.site_resumo === 'string' ? lead.dados.site_resumo : undefined,
      avaliacao: lead.avaliacao,
      total_avaliacoes: lead.total_avaliacoes,
      canais: {
        telefone: Boolean(lead.telefone || lead.telefones.length),
        email: lead.emails.length > 0,
        redes: lead.redes_sociais.map((item) => item.rede),
        decisor: lead.decisores[0]
          ? {
              cargo: lead.decisores[0].cargo,
              tem_contato: Boolean(lead.decisores[0].email || lead.decisores[0].telefone),
            }
          : null,
      },
    }));
    const resposta = await openai.responses.parse({
      model: LIVE_COACH_MODEL,
      input: [
        {
          role: 'system',
          content:
            'Você qualifica empresas para um prestador vender um projeto de IA. Escolha somente um dos cinco projetos permitidos. Use apenas os fatos recebidos; o motivo deve ser uma hipótese comercial prudente, nunca uma afirmação sobre processo interno. Evidências devem repetir fatos públicos objetivos. A pergunta de abertura deve descobrir o processo atual sem pressupor dor. Seja curto, humano e específico.',
        },
        { role: 'user', content: JSON.stringify(entrada) },
      ],
      text: { format: zodTextFormat(AnaliseSchema, 'qualificacao_de_projetos') },
    });
    const recebidas = new Map(
      (resposta.output_parsed?.analises ?? []).map((analise) => [analise.chave, analise]),
    );
    return {
      modo: 'ia',
      leads: leads.map((lead) =>
        aplicarAnalise(
          lead,
          recebidas.get(lead.chave_externa) ?? fallback.get(lead.chave_externa)!,
        ),
      ),
    };
  } catch (erro) {
    console.error('[prospeccao:inteligencia] classificação por IA indisponível:', erro);
    return {
      modo: 'regras',
      leads: leads.map((lead) => aplicarAnalise(lead, fallback.get(lead.chave_externa)!)),
    };
  }
}
