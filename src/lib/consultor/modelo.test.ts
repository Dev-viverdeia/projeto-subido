import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sinaisDeQualidade } from './qualidade-cenarios';
import { gerarRodadaSobral } from './modelo';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/env', () => ({
  openAIEnv: () => ({ OPENAI_API_KEY: 'chave-sintetica', SOBRAL_AI_MODEL: 'modelo-teste' }),
}));
const { parse } = vi.hoisted(() => ({ parse: vi.fn() }));
vi.mock('openai', () => ({
  default: class {
    responses = { parse };
  },
}));
describe('pedido enviado ao modelo', () => {
  beforeEach(() => {
    parse.mockReset();
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
  });
});
