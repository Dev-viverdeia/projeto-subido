export type TipoRequisito = 'acesso' | 'dados' | 'pessoas' | 'teste' | 'regra';

type ResumoRequisito = { titulo: string; tipo: TipoRequisito };

/** Rótulos editoriais, não novos requisitos. Só resumimos textos exatamente conhecidos;
 * uma edição no conteúdo administrado volta a exibir o original, sem perder condições. */
const REQUISITOS: Record<string, ResumoRequisito> = {
  'Acesso oficial ao WhatsApp Business Platform': { titulo: 'WhatsApp oficial', tipo: 'acesso' },
  'FAQ, oferta, políticas e critérios comerciais aprovados': {
    titulo: 'Respostas e critérios aprovados',
    tipo: 'dados',
  },
  'Uma pessoa responsável por receber transferências': {
    titulo: 'Responsável pelo atendimento',
    tipo: 'pessoas',
  },
  'Agenda e ambiente de testes separados da operação real': {
    titulo: 'Agenda e ambiente de testes',
    tipo: 'teste',
  },
  'Oferta clara e histórico mínimo de clientes aderentes': {
    titulo: 'Oferta e perfil dos clientes',
    tipo: 'dados',
  },
  'Fontes licenciadas com custo, limite e validade conhecidos': {
    titulo: 'Fontes de dados licenciadas',
    tipo: 'acesso',
  },
  'CRM com responsável pelo aceite ou descarte das contas': {
    titulo: 'Responsável pela lista no CRM',
    tipo: 'pessoas',
  },
  'Política de consentimento, retenção e acesso às gravações': {
    titulo: 'Permissão para gravar',
    tipo: 'regra',
  },
  'CRM com oportunidade e participantes identificados': {
    titulo: 'Oportunidade e participantes no CRM',
    tipo: 'dados',
  },
  'Playbook comercial versionado e líder para calibrar a leitura': {
    titulo: 'Método de vendas e liderança',
    tipo: 'regra',
  },
  'Vendedores disponíveis para um piloto acompanhado': {
    titulo: 'Equipe para testar o projeto',
    tipo: 'pessoas',
  },
  'Fontes próprias com permissão e porta-voz disponível': {
    titulo: 'Fontes e porta-voz da empresa',
    tipo: 'dados',
  },
  'Guia de voz, restrições da marca e exemplos aprovados': {
    titulo: 'Orientações da marca',
    tipo: 'regra',
  },
  'Uma pessoa com autoridade para revisar e aprovar': {
    titulo: 'Responsável pela aprovação',
    tipo: 'pessoas',
  },
  'Acesso aos canais e às métricas do período': { titulo: 'Canais e métricas', tipo: 'acesso' },
  'Evento de envio e público claramente definidos': {
    titulo: 'Público e momento da pesquisa',
    tipo: 'regra',
  },
  'Canal autorizado para pedir a avaliação': { titulo: 'Canal autorizado', tipo: 'acesso' },
  'Uma pessoa responsável por recuperar casos críticos': {
    titulo: 'Responsável pelos casos críticos',
    tipo: 'pessoas',
  },
  'Critérios simples para nota, tema e urgência': {
    titulo: 'Critérios da avaliação',
    tipo: 'regra',
  },
};

export function resumirRequisito(texto: string): ResumoRequisito | null {
  return Object.hasOwn(REQUISITOS, texto) ? REQUISITOS[texto]! : null;
}

// Destinos oficiais explícitos: texto cadastrado nunca é interpretado como URL.
const FERRAMENTAS: Record<string, string> = {
  Supabase: 'https://supabase.com/dashboard',
  OpenAI: 'https://platform.openai.com/',
  'OpenAI API': 'https://platform.openai.com/',
  'WhatsApp Business Platform': 'https://developers.facebook.com/docs/whatsapp/',
  'Google Calendar': 'https://calendar.google.com/',
};

export function destinoFerramenta(titulo: string): string | null {
  return Object.hasOwn(FERRAMENTAS, titulo) ? FERRAMENTAS[titulo]! : null;
}

export function nomeArquivoMaterial(titulo: string): string {
  const nome = titulo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100)
    .replace(/-$/, '');
  return `${nome || 'material'}.txt`;
}
