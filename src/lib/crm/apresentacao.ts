const UUID = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;
const UUID_GLOBAL = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;
const DATA_ISO = /\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?\b/g;
const DATA_BR_COM_HORA = /\b(\d{2})\/(\d{2})\/(\d{4})\s+\d{2}:\d{2}:\d{2}\s+UTC\b/g;

function limitar(texto: string, maximo: number): string {
  const limpo = texto.replace(/\s+/g, ' ').trim();
  if (limpo.length <= maximo) return limpo;

  const recorte = limpo.slice(0, maximo + 1);
  const fimFrase = Math.max(recorte.lastIndexOf('. '), recorte.lastIndexOf('? '));
  if (fimFrase >= Math.floor(maximo * 0.55)) return recorte.slice(0, fimFrase + 1).trim();

  const ultimaPalavra = recorte.lastIndexOf(' ');
  return `${recorte.slice(0, ultimaPalavra > 0 ? ultimaPalavra : maximo).trim()}…`;
}

function dataHumana(valor: string): string {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(data);
}

/** Mantém a leitura executiva curta mesmo quando um provedor antigo devolve
 * um parágrafo maior que o padrão editorial atual. */
export function resumoParaFicha(valor: string): string {
  const frases = valor.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((frase) => frase.trim()) ?? [];
  const abertura = frases.slice(0, 2).join(' ');
  return limitar(abertura.length >= 80 ? abertura : valor, 260);
}

/** A ação precisa caber em um olhar. Detalhes depois de dois-pontos pertencem
 * à justificativa e continuam salvos no dossiê completo. */
export function acaoParaFicha(valor: string): string {
  const [semDetalhes] = valor.split(/:\s+/, 1);
  const [semAnexo] = (semDetalhes ?? valor).split(/\s+e\s+anexando\b/i, 1);
  const curta = limitar(semAnexo ?? semDetalhes ?? valor, 120);
  return /[.!?]$/.test(curta) ? curta : `${curta}.`;
}

/** Resultados antigos podem conter UUIDs, nomes de colunas e datas ISO. Esses
 * dados ajudam o sistema, mas não o profissional que prepara uma reunião. */
export function valorFatoParaFicha(valor: string): string {
  const titulo = valor.match(/t[ií]tulo\s+['“"]([^'”"]+)['”"]/i)?.[1];
  const criadaEm = valor.match(/criado_em\s+([^;\s]+)/i)?.[1];

  if (UUID.test(valor) && titulo) {
    const partes = [`Projeto em negociação: ${titulo}.`];
    if (criadaEm) partes.push(`Ficha criada em ${dataHumana(criadaEm)}.`);
    return partes.join(' ');
  }

  const limpo = valor
    .replace(UUID_GLOBAL, '')
    .replace(DATA_ISO, (data) => dataHumana(data))
    .replace(DATA_BR_COM_HORA, (_, dia, mes, ano) =>
      dataHumana(`${ano}-${mes}-${dia}T12:00:00-03:00`),
    )
    .replace(/\s*\(status:\s*[^)]+\)/gi, '')
    .replace(/\b(?:id|criado_em|atualizado_em|origem|fonte)\s*[:=]?\s*/gi, '')
    .replace(/\(\s*plataforma\s*\)/gi, '')
    .replace(/\(\s*:\s*plataforma\s*\)/gi, '')
    .replace(/\s*;\s*/g, '. ')
    .replace(/\s+/g, ' ')
    .replace(/\.{2,}/g, '.')
    .trim();

  return limitar(limpo, 260);
}
