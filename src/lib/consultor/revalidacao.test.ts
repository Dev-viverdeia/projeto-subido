import { beforeEach, describe, expect, it, vi } from 'vitest';

const { revalidatePath } = vi.hoisted(() => ({ revalidatePath: vi.fn() }));

vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('server-only', () => ({}));

import { revalidarDirecaoOperacional } from './revalidacao';

describe('revalidarDirecaoOperacional', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sincroniza a única superfície do Sobral AI', () => {
    revalidarDirecaoOperacional();

    expect(revalidatePath).toHaveBeenCalledOnce();
    expect(revalidatePath).toHaveBeenCalledWith('/inicio');
  });
});
