import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sinaisDeQualidade } from './qualidade-cenarios';
import { gerarRodadaSobral } from './modelo';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/env', () => ({
  openAIEnv: () => ({ OPENAI_API_KEY: 'chave-sintetica', SOBRAL_AI_MODEL: 'modelo-teste' }),
}));
const { parse, count, reservar, informar } = vi.hoisted(() => ({
  parse: vi.fn(),
  count: vi.fn(),
  reservar: vi.fn(),
  informar: vi.fn(),
}));
vi.mock('./orcamento', () => ({ comOrcamentoSobral: reservar }));
vi.mock('openai', () => ({
  default: class {
    static RateLimitError = class extends Error {};
    static AuthenticationError = class extends Error {};
    static APIError = class extends Error {};
    responses = { parse, inputTokens: { count } };
  },
}));
describe('pedido enviado ao modelo', () => {
  beforeEach(() => {
    parse.mockReset();
    count.mockReset();
    informar.mockReset();
    reservar
      .mockReset()
      .mockImplementation(
        (_dono, _teto, gerar: (informar: (n: number) => void) => Promise<unknown>) =>
          gerar(informar),
      );
  });
  it('mantém cadastros fora das instruções e o pedido do usuário por último', async () => {
    const sinais = sinaisDeQualidade();
    const acao = {
      titulo: 'Estudar fundamentos',
      detalhe: 'Abra a formação disponível para estudar os fundamentos.',
      evidencia: 'Primeira aula estudada.',
      destino: '/formacoes',
    };
    const resposta = {
      resposta: 'Estude fundamentos antes de implementar.',
      usar_venda_em_foco: false,
      proximo_passo: acao,
      acoes: [],
    };
    parse.mockResolvedValue({
      output_parsed: resposta,
      id: 'resposta',
      usage: { input_tokens: 50, output_tokens: 20 },
    });
    const rodada = await gerarRodadaSobral({
      usuarioId: 'id-teste',
      etapa: 'aprender',
      sinais,
      historico: [],
      pedido: 'Quero estudar IA.',
    });
    const parametros = parse.mock.calls[0]?.[0] as {
      instructions: string;
      input: { role: string; content: string }[];
      store: boolean;
      safety_identifier: string;
      text: { format: { schema: { properties: Record<string, unknown> } } };
    };
    expect(parametros.instructions).not.toContain('Clínica Aurora');
    expect(parametros.input[0]?.content).toContain('Clínica Aurora');
    expect(parametros.input.at(-1)).toEqual({ role: 'user', content: 'Quero estudar IA.' });
    expect(parametros.store).toBe(false);
    expect(parametros.safety_identifier).not.toContain('id-teste');
    expect(parametros.text.format.schema.properties).toHaveProperty('usar_venda_em_foco');
    expect(rodada.tokens).toBe(70);
    expect(parametros.text.format.schema.properties).not.toHaveProperty('resumo_material');
    expect(informar).toHaveBeenCalledWith(70);
    expect(rodada.resumoMaterial).toBeNull();
  });

  it('conta arquivos com o contrato de inputTokens e reserva antes de gerar', async () => {
    count.mockResolvedValue({ input_tokens: 4200 });
    parse.mockResolvedValue({
      id: 'r',
      usage: { input_tokens: 4200, output_tokens: 10 },
      output_parsed: {
        resposta: 'Arquivo recebido.',
        proximo_passo: {
          titulo: 'Revisar o documento',
          detalhe: 'Confira o arquivo recebido.',
          evidencia: 'Documento revisado.',
          destino: '/vendas',
        },
        acoes: [],
      },
    });
    await gerarRodadaSobral({
      usuarioId: 'qa',
      etapa: 'aprender',
      sinais: sinaisDeQualidade(),
      historico: [],
      pedido: 'Leia este PDF.',
      anexos: [
        { id: 'a', nome: 'documento.pdf', categoria: 'documento', fileId: 'file-sintetico' },
      ],
    });
    expect(Object.keys(count.mock.calls[0]![0] as object).sort()).toEqual(
      ['model', 'input', 'instructions', 'reasoning', 'text'].sort(),
    );
    expect(reservar).toHaveBeenCalledWith('qa', 7400, expect.any(Function), undefined);
    expect(reservar.mock.invocationCallOrder[0]).toBeLessThan(parse.mock.invocationCallOrder[0]!);
  });

  it('pede resumo estruturado somente com anexos novos, sem incluir nomes de arquivo nas instruções', async () => {
    const resumo = {
      titulo: 'Resumo da conversa',
      escopo: 'Triagem no WhatsApp.',
      decisoes: '',
      tarefas: '',
      pendencias: 'Confirmar preço.',
    };
    const acao = {
      titulo: 'Revisar o resumo',
      detalhe: 'Confira o conteúdo antes de salvar na ficha.',
      evidencia: 'Resumo revisado pelo usuário.',
      destino: '/vendas',
    };
    parse.mockResolvedValue({
      output_parsed: {
        resposta: 'Revise o resumo antes de salvar.',
        resumo_material: resumo,
        proximo_passo: acao,
        acoes: [],
      },
      id: 'resposta',
      usage: {},
    });
    const resultado = await gerarRodadaSobral({
      usuarioId: 'qa',
      etapa: 'vender',
      sinais: sinaisDeQualidade(),
      historico: [],
      pedido: 'Analise o áudio.',
      anexos: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          nome: 'NOME-NAO-CONFIAVEL.webm',
          categoria: 'audio',
          transcricao: 'Só triagem.',
        },
      ],
    });
    const pedido = parse.mock.calls[0]?.[0] as {
      instructions: string;
      input: unknown[];
      text: { format: { schema: { properties: Record<string, unknown> } } };
    };
    expect(pedido.text.format.schema.properties).toHaveProperty('resumo_material');
    expect(pedido.instructions).toContain('RESUMO DO MATERIAL PARA REVISÃO');
    expect(pedido.instructions).not.toContain('NOME-NAO-CONFIAVEL');
    expect(JSON.stringify(pedido.input.at(-1))).toContain('Só triagem.');
    expect(resultado.resumoMaterial).toEqual(resumo);
    expect(parse).toHaveBeenCalledOnce();
  });
});
