import { describe, expect, it } from 'vitest';
import nextConfig from './next.config';

describe('rotas comerciais públicas', () => {
  it('resolve as raízes sem depender de parâmetro opcional', async () => {
    const rewrites = await nextConfig.rewrites?.();

    expect(rewrites).toEqual(
      expect.arrayContaining([
        { source: '/vendas', destination: '/crm' },
        { source: '/reunioes', destination: '/calls' },
      ]),
    );
  });
});
