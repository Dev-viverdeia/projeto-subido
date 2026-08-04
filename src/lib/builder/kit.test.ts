import { describe, expect, it } from 'vitest';
import type { DocumentoSolucao } from './schema';
import { montarKit, nomeDoArquivo } from './kit';

/**
 * O kit é servido como download, e o nome do arquivo entra num header
 * `Content-Disposition` — montado a partir de um título que o MODELO escreveu.
 * Isso faz de `nomeDoArquivo` uma fronteira de segurança, não uma função de
 * formatação: aspas, quebra de linha ou barra num nome de arquivo saem no header
 * e quebram (ou pior) a resposta.
 *
 * O resto prende a regra do produto: todo arquivo é PROJEÇÃO do documento, e
 * seção vazia não vira arquivo com cabeçalho e nada embaixo.
 */
function doc(over: Partial<DocumentoSolucao> = {}): DocumentoSolucao {
  return {
    titulo: 'Vendedor no WhatsApp',
    resumo: 'Um resumo.',
    viabilidade: { nivel: 'media', justificativa: 'j' },
    arquitetura: 'a',
    ferramentas: [{ nome: 'n8n', papel: 'orquestra' }],
    etapas: [
      { titulo: 'Criar conta', descricao: 'd', ferramentas: [], fase: 1 },
      { titulo: 'Ligar o fluxo', descricao: 'd', ferramentas: ['n8n'], fase: 2 },
    ],
    prompts: [{ titulo: 'Classificar', conteudo: 'c' }],
    riscos: [{ risco: 'r', mitigacao: 'm' }],
    economia: { horas_por_mes: 10, premissas: ['p'] },
    fora_do_escopo: ['x'],
    ...over,
  } as DocumentoSolucao;
}

describe('kit do projeto', () => {
  it('o índice vem primeiro — é o que a IA deve ler antes de tudo', () => {
    expect(montarKit(doc())[0]?.nome).toBe('COMO-USAR.md');
  });

  it('seção vazia não vira arquivo', () => {
    const nomes = montarKit(doc({ prompts: [], ferramentas: [] })).map((a) => a.nome);
    expect(nomes).not.toContain('PROMPTS.md');
    expect(nomes).not.toContain('FERRAMENTAS.md');
    /* O plano e o projeto sempre existem: o schema garante ao menos 3 etapas. */
    expect(nomes).toContain('PLANO.md');
    expect(nomes).toContain('PROJETO.md');
  });

  it('o índice lista só os arquivos que realmente foram para o ZIP', () => {
    const kit = montarKit(doc({ prompts: [] }));
    const indice = kit[0]!.conteudo;
    expect(indice).toContain('PLANO.md');
    expect(indice).not.toContain('PROMPTS.md');
  });

  it('com fase declarada, o plano agrupa; sem, fica corrido', () => {
    const comFase = montarKit(doc()).find((a) => a.nome === 'PLANO.md')!.conteudo;
    expect(comFase).toContain('Fase 1 · Fundação');
    expect(comFase).toContain('Fase 2 · Construção');
    /* Fase 3 não tem etapa — não pode aparecer como seção vazia. */
    expect(comFase).not.toContain('Fase 3');

    const semFase = montarKit(
      doc({
        etapas: [{ titulo: 'A', descricao: 'd', ferramentas: [] }] as DocumentoSolucao['etapas'],
      }),
    ).find((a) => a.nome === 'PLANO.md')!.conteudo;
    expect(semFase).not.toContain('Fase 1');
  });

  /* FRONTEIRA DE SEGURANÇA: o título vem do modelo e vai para um header HTTP. */
  it('o nome do arquivo não deixa passar aspas, quebra de linha nem barra', () => {
    const nome = nomeDoArquivo('Projeto "X"\r\nContent-Type: text/html/../../etc');
    expect(nome).not.toMatch(/["\r\n/\\]/);
    expect(nome.endsWith('.zip')).toBe(true);
  });

  it('título só de símbolos ainda produz um nome utilizável', () => {
    expect(nomeDoArquivo('¿¡—')).toBe('projeto-kit.zip');
  });

  it('acento vira ascii em vez de sumir com a palavra', () => {
    expect(nomeDoArquivo('Automação de Funis')).toBe('automacao-de-funis-kit.zip');
  });
});
