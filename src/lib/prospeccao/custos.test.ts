import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { custoOpenAIUsdMicros } from './custos';

describe('rate card da Prospecção', () => {
  it('calcula input, cache e output do GPT-5.6 Luna em USD micros', () => {
    expect(
      custoOpenAIUsdMicros({
        modelo: 'gpt-5.6-luna',
        inputTokens: 4_000,
        cachedInputTokens: 1_000,
        outputTokens: 1_000,
      }),
    ).toBe(1_820);
  });

  it('não inventa custo para um modelo sem rate card cadastrado', () => {
    expect(
      custoOpenAIUsdMicros({
        modelo: 'modelo-futuro',
        inputTokens: 1_000,
        cachedInputTokens: 0,
        outputTokens: 1_000,
      }),
    ).toBeUndefined();
  });
});
