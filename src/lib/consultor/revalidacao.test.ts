import { beforeEach, describe, expect, it, vi } from 'vitest';

const { revalidatePath } = vi.hoisted(() => ({ revalidatePath: vi.fn() }));

vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('server-only', () => ({}));

import { revalidarDirecaoOperacional } from './revalidacao';

describe('revalidarDirecaoOperacional', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sincroniza a Início e todas as superfícies do Sobral AI', () => {
    revalidarDirecaoOperacional();

    expect(revalidatePath).toHaveBeenNthCalledWith(1, '/inicio');
    expect(revalidatePath).toHaveBeenNthCalledWith(2, '/consultor');
    expect(revalidatePath).toHaveBeenNthCalledWith(3, '/consultor/[id]', 'page');
  });
});
