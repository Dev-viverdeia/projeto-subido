import type { DocumentoSolucao } from './schema';
import { paraMarkdown } from './markdown';

/**
 * O KIT DO PROJETO — o documento quebrado em arquivos FOCADOS.
 *
 * POR QUE ARQUIVOS SEPARADOS E NÃO UM MARKDOWN SÓ. O destino deles é uma IA:
 * a pessoa anexa o kit no Lovable ou aponta o Claude Code para a pasta. Um
 * arquivo de 40 KB obriga o modelo a carregar tudo para responder qualquer
 * coisa; cinco arquivos com nome que diz o assunto deixam o prompt de partida
 * mandar ler o que interessa primeiro. É a mesma razão pela qual a referência
 * escreve "leia primeiro o SKILL.md e depois o README.md".
 *
 * SÃO CINCO, NÃO ONZE. A plataforma de referência gera onze documentos porque
 * roda três agentes que escrevem coisas diferentes; aqui há UMA geração que
 * produz UM documento. Cinco arquivos é o que esse documento sustenta sem
 * repetição — e anunciar onze recortando o mesmo texto em fatias menores seria
 * inflar número, que é o oposto do que este produto faz.
 *
 * NADA AQUI É INVENTADO: todo arquivo é uma projeção do `documento`. Se um
 * campo está vazio, o arquivo correspondente não entra no ZIP em vez de sair com
 * um cabeçalho e nada embaixo.
 */
export type ArquivoDoKit = { nome: string; conteudo: string };

const FASES: Record<number, string> = {
  1: 'Fase 1 · Fundação',
  2: 'Fase 2 · Construção',
  3: 'Fase 3 · Polimento e lançamento',
};

/** O plano de execução, agrupado por fase quando o documento as declara. */
function plano(documento: DocumentoSolucao): string {
  const l: string[] = ['# Plano de execução', '', `> ${documento.titulo}`, ''];

  const temFase = documento.etapas.some((e) => e.fase !== undefined);

  if (!temFase) {
    /* Documento anterior às fases: lista corrida, sem inventar agrupamento. */
    documento.etapas.forEach((etapa, i) => {
      l.push(`## ${String(i + 1).padStart(2, '0')}. ${etapa.titulo}`, '', etapa.descricao, '');
      if (etapa.ferramentas.length > 0) l.push(`Ferramentas: ${etapa.ferramentas.join(', ')}`, '');
    });
    return l.join('\n');
  }

  for (const numero of [1, 2, 3]) {
    const daFase = documento.etapas
      .map((etapa, i) => ({ etapa, i }))
      .filter(({ etapa }) => etapa.fase === numero);
    if (daFase.length === 0) continue;

    l.push(`## ${FASES[numero]}`, '');
    for (const { etapa, i } of daFase) {
      l.push(`### ${String(i + 1).padStart(2, '0')}. ${etapa.titulo}`, '', etapa.descricao, '');
      if (etapa.ferramentas.length > 0) l.push(`Ferramentas: ${etapa.ferramentas.join(', ')}`, '');
    }
  }

  return l.join('\n');
}

function ferramentas(documento: DocumentoSolucao): string {
  const l = ['# Ferramentas', '', `> ${documento.titulo}`, ''];
  for (const f of documento.ferramentas) l.push(`## ${f.nome}`, '', f.papel, '');
  return l.join('\n');
}

function prompts(documento: DocumentoSolucao): string {
  const l = ['# Prompts prontos', '', `> ${documento.titulo}`, ''];
  for (const p of documento.prompts) l.push(`## ${p.titulo}`, '', '```', p.conteudo, '```', '');
  return l.join('\n');
}

/**
 * O arquivo que a IA deve ler PRIMEIRO. Ele não repete o projeto — diz o que é
 * cada arquivo e em que ordem usar, que é a única coisa que um índice precisa
 * fazer.
 */
function comoUsar(documento: DocumentoSolucao, arquivos: string[]): string {
  return [
    '# Como usar este kit',
    '',
    `Projeto: **${documento.titulo}**`,
    '',
    documento.resumo,
    '',
    '## Ordem de leitura',
    '',
    ...arquivos.filter((n) => n !== 'COMO-USAR.md').map((n) => `1. \`${n}\``),
    '',
    '## O que fazer',
    '',
    /* AS INSTRUÇÕES SEGUEM OS ARQUIVOS QUE EXISTEM. A versão anterior citava
       `PROMPTS.md` fixo, e um projeto sem prompts mandava a IA abrir um arquivo
       que não estava no ZIP — a mesma classe de erro do prompt de partida que
       cita `SKILL.md`. Quem pegou foi o teste. */
    ...[
      'Leia `PROJETO.md` para entender o que está sendo construído.',
      'Siga `PLANO.md` na ordem — uma etapa de cada vez.',
      arquivos.includes('PROMPTS.md')
        ? 'Use `PROMPTS.md` quando a etapa pedir um prompt pronto.'
        : null,
      arquivos.includes('FERRAMENTAS.md')
        ? 'Consulte `FERRAMENTAS.md` para saber o papel de cada ferramenta.'
        : null,
    ]
      .filter((linha): linha is string => linha !== null)
      .map((linha, i) => `${i + 1}. ${linha}`),
    '',
    '> Este kit foi gerado a partir de uma única descrição do projeto. Ele é um',
    '> ponto de partida revisável, não uma especificação fechada.',
  ].join('\n');
}

export function montarKit(documento: DocumentoSolucao): ArquivoDoKit[] {
  const arquivos: ArquivoDoKit[] = [
    { nome: 'PROJETO.md', conteudo: paraMarkdown(documento) },
    { nome: 'PLANO.md', conteudo: plano(documento) },
  ];

  /* Só entra o que EXISTE. Arquivo com cabeçalho e nada embaixo é pior que
     arquivo ausente: a IA o abre, não encontra nada e segue sem o contexto. */
  if (documento.ferramentas.length > 0) {
    arquivos.push({ nome: 'FERRAMENTAS.md', conteudo: ferramentas(documento) });
  }
  if (documento.prompts.length > 0) {
    arquivos.push({ nome: 'PROMPTS.md', conteudo: prompts(documento) });
  }

  return [
    {
      nome: 'COMO-USAR.md',
      conteudo: comoUsar(
        documento,
        arquivos.map((a) => a.nome),
      ),
    },
    ...arquivos,
  ];
}

/** Nome de arquivo seguro a partir do título, sem acento nem separador de caminho. */
export function nomeDoArquivo(titulo: string): string {
  const base = titulo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 60);
  return `${base || 'projeto'}-kit.zip`;
}
