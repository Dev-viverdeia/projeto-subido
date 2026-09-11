// @vitest-environment node

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import type { PropostaCompleta } from './queries';
import { DocumentoPropostaSchema, formatarReais } from './schema';

vi.mock('server-only', () => ({}));

const PROPOSTA: PropostaCompleta = {
  id: '11111111-1111-4111-8111-111111111111',
  titulo: 'Proposta · Atendimento com IA',
  status: 'pronta',
  versao: 3,
  atualizadoEm: '2026-08-07T18:00:00Z',
  criadoEm: '2026-08-07T17:00:00Z',
  empresa: 'Clínica Horizonte',
  projeto: 'Atendimento com IA',
  valorCentavos: 1_800_000,
  compartilhadaEm: null,
  ultimaVisualizacaoEm: null,
  visualizacoes: 0,
  decididaEm: null,
  empresaId: '22222222-2222-4222-8222-222222222222',
  oportunidadeId: '33333333-3333-4333-8333-333333333333',
  projetoId: '44444444-4444-4444-8444-444444444444',
  builderSolucaoId: null,
  reuniaoId: '55555555-5555-4555-8555-555555555555',
  compartilhamento: {
    codigo: null,
    ativo: false,
    compartilhadaEm: null,
    primeiraVisualizacaoEm: null,
    ultimaVisualizacaoEm: null,
    visualizacoes: 0,
    decisaoNome: null,
    decisaoEmail: null,
    decisaoComentario: null,
    decididaEm: null,
  },
  documento: {
    fornecedor: {
      nomeResponsavel: 'Lucas Costa',
      nomeNegocio: 'Estúdio Horizonte',
      email: 'contato@example.com',
      telefone: null,
      site: 'https://example.com',
      logoUrl: null,
    },
    cliente: {
      empresa: 'Clínica Horizonte',
      contato: 'Marina Alves',
      cargo: 'Diretora de Operações',
      email: 'marina@example.com',
    },
    projeto: {
      titulo: 'Atendimento com IA',
      resumo:
        'Uma operação de atendimento organizada, assistida por inteligência artificial e pronta para crescer sem perder contexto.',
      origem: 'catalogo',
    },
    desafio:
      'A clínica recebe um volume alto de mensagens em diferentes canais. Nas trocas de turno, o contexto se perde, o tempo de primeira resposta aumenta e a liderança não consegue enxergar onde estão os gargalos da operação.',
    objetivo:
      'Diminuir o tempo de primeira resposta, organizar cada solicitação e criar uma visão clara da qualidade do atendimento.',
    escopo: [
      {
        titulo: 'Entender a operação',
        descricao:
          'Mapear canais, tipos de solicitação, responsáveis e critérios usados hoje para priorizar cada conversa.',
      },
      {
        titulo: 'Preparar a base',
        descricao:
          'Organizar o conhecimento da clínica e definir as regras que a inteligência artificial deve respeitar.',
      },
      {
        titulo: 'Construir os fluxos',
        descricao:
          'Configurar a triagem assistida, o histórico central e as respostas recomendadas para os principais cenários.',
      },
      {
        titulo: 'Validar com o time',
        descricao:
          'Testar conversas reais, revisar exceções e medir qualidade antes de liberar a operação completa.',
      },
      {
        titulo: 'Entregar e acompanhar',
        descricao:
          'Capacitar responsáveis, documentar a rotina e acompanhar os primeiros resultados da operação.',
      },
    ],
    entregaveis: [
      'Mapa da jornada de atendimento',
      'Base de conhecimento organizada',
      'Fluxo de triagem assistida por IA',
      'Biblioteca de respostas recomendadas',
      'Painel com indicadores essenciais',
      'Documentação e sessão de capacitação',
    ],
    cronograma: [
      {
        fase: 'Diagnóstico e desenho',
        duracao: '1 semana',
        descricao: 'Mapeamento da operação, prioridades e critérios de sucesso.',
      },
      {
        fase: 'Construção',
        duracao: '2 semanas',
        descricao: 'Configuração dos fluxos, conhecimento e indicadores.',
      },
      {
        fase: 'Validação e entrega',
        duracao: '1 semana',
        descricao: 'Testes com o time, ajustes, documentação e capacitação.',
      },
    ],
    investimento: {
      valorCentavos: 1_800_000,
      condicoes: '50% na aprovação desta proposta e 50% na entrega da operação validada.',
    },
    validadeDias: 15,
    proximosPassos: [
      'Validar o escopo e os responsáveis internos.',
      'Aprovar esta proposta comercial.',
      'Realizar a reunião de início do projeto.',
    ],
    observacoes:
      'Integrações que dependam de licenças de terceiros serão confirmadas antes da contratação.',
  },
};

const normalizar = (texto: string) => texto.replace(/[–—−‑]/g, '-').replace(/[\s\u200b]/g, '');

async function inspecionar(proposta = PROPOSTA, amostra?: string) {
  const { renderizarPropostaPdf } = await import('./pdf');
  const antes = structuredClone(proposta);
  const pdf = await renderizarPropostaPdf({
    proposta,
    profissional: 'Estúdio Horizonte',
    geradoEm: new Date('2026-09-11T18:00:00-03:00'),
  });
  expect(proposta).toEqual(antes);
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  // Pesos com o mesmo nome PostScript colapsam numa fonte só no arquivo final.
  expect(pdf.toString('latin1')).toContain('Geist-Regular');
  expect(pdf.toString('latin1')).toContain('Geist-SemiBold');
  if (amostra) {
    const pasta = path.join(process.cwd(), 'tmp/pdfs');
    await mkdir(pasta, { recursive: true });
    await writeFile(path.join(pasta, `${amostra}.pdf`), pdf);
  }
  const leitura = getDocument({ data: new Uint8Array(pdf) });
  try {
    const documento = await leitura.promise;
    const paginas = await Promise.all(
      Array.from({ length: documento.numPages }, async (_, indice) => {
        const pagina = await documento.getPage(indice + 1);
        const conteudo = await pagina.getTextContent();
        const itens = conteudo.items.filter(
          (item): item is TextItem => 'str' in item && Boolean(item.str.trim()),
        );
        return {
          itens,
          texto: itens.map((item) => item.str).join(' '),
          corpo: itens
            .filter((item) => item.transform[5] > 62 && item.transform[5] < 780)
            .map((item) => item.str)
            .join(' '),
          links: (await pagina.getAnnotations()).map((item: unknown) =>
            typeof item === 'object' &&
            item !== null &&
            'dest' in item &&
            typeof item.dest === 'string'
              ? item.dest
              : null,
          ),
        };
      }),
    );
    return { paginas, sumario: await documento.getOutline(), bytes: pdf.byteLength };
  } finally {
    await leitura.destroy();
  }
}

function conferirConteudo(
  proposta: PropostaCompleta,
  paginas: Awaited<ReturnType<typeof inspecionar>>['paginas'],
) {
  const d = proposta.documento;
  const texto = normalizar(paginas.map((pagina) => pagina.corpo).join(' '));
  const campos = [
    d.projeto.titulo,
    d.projeto.resumo,
    d.cliente.empresa,
    d.cliente.contato,
    d.cliente.cargo,
    d.cliente.email,
    d.desafio,
    d.objetivo,
    ...d.escopo.flatMap((item) => [item.titulo, item.descricao]),
    ...d.entregaveis,
    ...d.cronograma.flatMap((item) => [item.fase, item.duracao, item.descricao]),
    d.investimento.condicoes,
    formatarReais(d.investimento.valorCentavos),
    `${d.validadeDias} ${d.validadeDias === 1 ? 'dia' : 'dias'}`,
    ...d.proximosPassos,
    d.observacoes,
    d.fornecedor?.nomeResponsavel,
    d.fornecedor?.email,
    d.fornecedor?.telefone,
    d.fornecedor?.site,
  ].filter((campo): campo is string => Boolean(campo));
  for (const campo of campos) expect(texto, campo).toContain(normalizar(campo));
  for (const [indice, pagina] of paginas.entries()) {
    expect(pagina.texto).toContain(`Versão ${proposta.versao}`);
    expect(pagina.texto).toContain('Confidencial · Criado com Subido');
    expect(pagina.texto).toContain(`${indice + 1} / ${paginas.length}`);
    expect(pagina.corpo.length, `Página ${indice + 1} não deve estar vazia`).toBeGreaterThan(30);
    for (const item of pagina.itens) {
      const x = Number(item.transform[4]);
      const y = Number(item.transform[5]);
      expect(x, item.str).toBeGreaterThanOrEqual(45);
      // PDF.js inclui o avanço do último glifo: tolerância de 3pt sobre a margem de 46pt.
      expect(x + item.width, item.str).toBeLessThanOrEqual(553);
      expect(y, item.str).toBeGreaterThan(24);
      expect(y + item.height, item.str).toBeLessThan(824);
    }
  }
}

function textoLongo(prefixo: string, tamanho: number) {
  const frase = 'Validar o processo com a equipe e registrar os critérios acordados. ';
  return (
    `${prefixo}: ${frase.repeat(Math.ceil(tamanho / frase.length))}`.slice(0, tamanho - 8) + ' FIM.'
  );
}

describe('PDF da proposta', () => {
  it('mantém todo o conteúdo, rodapés e sumário clicável em três páginas legíveis', async () => {
    const resultado = await inspecionar(PROPOSTA, 'proposta-comercial-exemplo');
    expect(resultado.bytes).toBeGreaterThan(15_000);
    expect(resultado.paginas).toHaveLength(3);
    conferirConteudo(PROPOSTA, resultado.paginas);
    expect(resultado.sumario?.map((item) => item.title)).toEqual([
      'Resumo',
      'Escopo e entregáveis',
      'Cronograma',
      'Próximos passos',
    ]);
    expect(resultado.paginas[0]!.links).toEqual(['escopo', 'prazo', 'proximos-passos']);
    // O título do cronograma precisa acompanhar a primeira fase, não ficar órfão.
    const cronograma = resultado.paginas.find((pagina) =>
      pagina.corpo.includes('Diagnóstico e desenho'),
    );
    expect(cronograma?.corpo).toContain('Cronograma');
  });

  it.each([null, 0, 100_000_000_000])(
    'preserva investimento %s sem confundir zero com valor a definir',
    async (valorCentavos) => {
      const proposta = structuredClone(PROPOSTA);
      proposta.documento.investimento.valorCentavos = valorCentavos;
      proposta.documento.validadeDias = valorCentavos === 0 ? 1 : 15;
      proposta.documento.fornecedor = null;
      proposta.documento.cliente.contato = valorCentavos === 0 ? '' : null;
      proposta.documento.cliente.cargo = null;
      proposta.documento.cliente.email = null;
      proposta.documento.observacoes = null;
      const resultado = await inspecionar(proposta);
      conferirConteudo(proposta, resultado.paginas);
      const primeiraPagina = normalizar(resultado.paginas[0]!.corpo);
      expect(primeiraPagina).toContain(normalizar(formatarReais(valorCentavos)));
      if (valorCentavos !== null) expect(primeiraPagina).not.toContain('Adefinir');
      if (valorCentavos === 0) {
        expect(primeiraPagina).not.toContain('1dias');
        expect(resultado.paginas.at(-1)?.corpo).toContain('Aprovação do cliente Clínica Horizonte');
      }
    },
  );

  it('pagina um documento extenso sem perder escopo, condições ou invadir as margens', async () => {
    const proposta = structuredClone(PROPOSTA);
    const d = proposta.documento;
    d.projeto.titulo = textoLongo('Projeto completo', 180);
    d.projeto.resumo = textoLongo('Resumo', 1200);
    d.cliente.empresa = textoLongo('Empresa', 160);
    d.cliente.contato = textoLongo('Contato', 160);
    d.cliente.cargo = textoLongo('Cargo', 160);
    d.desafio = textoLongo('Desafio', 4000);
    d.objetivo = textoLongo('Objetivo', 2000);
    d.escopo = Array.from({ length: 10 }, (_, i) => ({
      titulo: textoLongo(`Escopo ${i + 1}`, 140),
      descricao: textoLongo(`Descrição ${i + 1}`, 1200),
    }));
    d.entregaveis = Array.from({ length: 12 }, (_, i) => textoLongo(`Entregável ${i + 1}`, 300));
    d.cronograma = Array.from({ length: 8 }, (_, i) => ({
      fase: textoLongo(`Fase ${i + 1}`, 120),
      duracao: textoLongo(`Prazo ${i + 1}`, 80),
      descricao: textoLongo(`Marco ${i + 1}`, 600),
    }));
    d.investimento.condicoes = textoLongo('Condições', 1200);
    d.proximosPassos = Array.from({ length: 6 }, (_, i) => textoLongo(`Passo ${i + 1}`, 300));
    d.observacoes = textoLongo('Observações', 2000);
    expect(DocumentoPropostaSchema.safeParse(d).success).toBe(true);
    const resultado = await inspecionar(proposta, 'proposta-comercial-extensa');
    expect(resultado.paginas.length).toBeGreaterThan(5);
    conferirConteudo(proposta, resultado.paginas);
  }, 20_000);

  it('mantém links e palavras longas dentro da página sem cortar informação', async () => {
    const proposta = structuredClone(PROPOSTA);
    proposta.documento.fornecedor!.site = `https://example.com/${'a'.repeat(900)}`;
    proposta.documento.projeto.titulo = 'Implementação ' + 'X'.repeat(150);
    proposta.documento.escopo[0]!.descricao = 'Identificador: ' + 'Y'.repeat(400);
    const resultado = await inspecionar(proposta, 'proposta-comercial-links-longos');
    conferirConteudo(proposta, resultado.paginas);
  });

  it('preserva condições com muitas linhas sem deixar o card maior que a página', async () => {
    const proposta = structuredClone(PROPOSTA);
    proposta.documento.investimento.condicoes = Array.from(
      { length: 80 },
      (_, i) => `Condição ${i + 1}.`,
    ).join('\n');
    expect(DocumentoPropostaSchema.safeParse(proposta.documento).success).toBe(true);
    const resultado = await inspecionar(proposta, 'proposta-comercial-condicoes');
    conferirConteudo(proposta, resultado.paginas);
  });
});
