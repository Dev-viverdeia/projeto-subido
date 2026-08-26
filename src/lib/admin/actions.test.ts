import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  ehAdmin: vi.fn(),
  getUser: vi.fn(),
  getUserById: vi.fn(),
  updateUserById: vi.fn(),
  insert: vi.fn(),
  rpc: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('@/lib/auth/papeis', () => ({ ehAdmin: mocks.ehAdmin }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({ auth: { getUser: mocks.getUser } })),
}));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    auth: { admin: { getUserById: mocks.getUserById, updateUserById: mocks.updateUserById } },
    from: vi.fn(() => ({ insert: mocks.insert })),
    rpc: mocks.rpc,
  })),
}));

import { alterarPlanoAdmin, concederPacoteAdmin, ESTADO_ADMIN_ACESSO } from './actions';

const ADMIN_ID = '11111111-1111-4111-8111-111111111111';
const USUARIO_ID = '22222222-2222-4222-8222-222222222222';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.ehAdmin.mockResolvedValue(true);
  mocks.getUser.mockResolvedValue({ data: { user: { id: ADMIN_ID } }, error: null });
  mocks.getUserById.mockResolvedValue({
    data: {
      user: {
        id: USUARIO_ID,
        app_metadata: { provider: 'email', providers: ['email'], plano_subido: 'starter' },
      },
    },
    error: null,
  });
  mocks.updateUserById.mockResolvedValue({ data: {}, error: null });
  mocks.insert.mockResolvedValue({ data: null, error: null });
  mocks.rpc.mockResolvedValue({ data: 180, error: null });
});

describe('administração de acessos', () => {
  it('preserva o app_metadata existente ao trocar o plano e registra o histórico', async () => {
    const formulario = new FormData();
    formulario.set('usuario', USUARIO_ID);
    formulario.set('plano', 'pro');

    const resultado = await alterarPlanoAdmin(ESTADO_ADMIN_ACESSO, formulario);

    expect(resultado).toMatchObject({ status: 'sucesso', plano: 'pro' });
    expect(mocks.updateUserById).toHaveBeenCalledWith(USUARIO_ID, {
      app_metadata: { provider: 'email', providers: ['email'], plano_subido: 'pro' },
    });
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        admin_id: ADMIN_ID,
        usuario_id: USUARIO_ID,
        tipo: 'plano_alterado',
        plano_anterior: 'starter',
        plano_novo: 'pro',
      }),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/admin/acessos');
  });

  it('não executa nenhuma mudança quando a sessão não é administrativa', async () => {
    mocks.ehAdmin.mockResolvedValue(false);
    const formulario = new FormData();
    formulario.set('usuario', USUARIO_ID);
    formulario.set('plano', 'pro');

    const resultado = await alterarPlanoAdmin(ESTADO_ADMIN_ACESSO, formulario);

    expect(resultado.status).toBe('erro');
    expect(mocks.getUserById).not.toHaveBeenCalled();
    expect(mocks.updateUserById).not.toHaveBeenCalled();
  });

  it('permite atribuir o plano Enterprise sem apagar metadados da conta', async () => {
    const formulario = new FormData();
    formulario.set('usuario', USUARIO_ID);
    formulario.set('plano', 'enterprise');

    const resultado = await alterarPlanoAdmin(ESTADO_ADMIN_ACESSO, formulario);

    expect(resultado).toMatchObject({ status: 'sucesso', plano: 'enterprise' });
    expect(mocks.updateUserById).toHaveBeenCalledWith(USUARIO_ID, {
      app_metadata: { provider: 'email', providers: ['email'], plano_subido: 'enterprise' },
    });
  });

  it('concede somente um pacote conhecido e devolve o novo saldo', async () => {
    const formulario = new FormData();
    formulario.set('usuario', USUARIO_ID);
    formulario.set('pacote', 'crescimento');

    const resultado = await concederPacoteAdmin(ESTADO_ADMIN_ACESSO, formulario);

    expect(resultado).toMatchObject({ status: 'sucesso', saldo: 180 });
    expect(mocks.rpc).toHaveBeenCalledWith(
      'admin_sistema_conceder_pacote',
      expect.objectContaining({
        p_admin: ADMIN_ID,
        p_usuario: USUARIO_ID,
        p_pacote: 'crescimento',
      }),
    );
  });

  it('recusa quantidade avulsa disfarçada de pacote', async () => {
    const formulario = new FormData();
    formulario.set('usuario', USUARIO_ID);
    formulario.set('pacote', '9999');

    const resultado = await concederPacoteAdmin(ESTADO_ADMIN_ACESSO, formulario);

    expect(resultado.status).toBe('erro');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
