import { beforeEach, describe, expect, it, vi } from 'vitest';
import { montarPlanoCall } from '@/lib/calls/plano';

const { obterContextoDaSala, obterContextoCoach, createClient } = vi.hoisted(() => ({
  obterContextoDaSala: vi.fn(),
  obterContextoCoach: vi.fn(),
  createClient: vi.fn(),
}));
vi.mock('@/lib/calls/queries', () => ({ obterContextoDaSala }));
vi.mock('@/lib/calls/contexto-coach', () => ({ obterContextoCoach }));
vi.mock('@/lib/supabase/server', () => ({ createClient }));
vi.mock('@/lib/env', () => ({ livekitEnv: () => ({}) }));
vi.mock('./SalaCall', () => ({ SalaCall: () => null }));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('not-found');
  },
}));
import SalaCallPage from './page';

const plano = montarPlanoCall({
  tipo: 'descoberta',
  empresa: 'Cliente confidencial',
  oportunidade: 'Projeto privado',
  proximaAcao: null,
  dossie: null,
});
const contexto = {
  anfitriao: true,
  nomeSugerido: 'Organizador',
  convite: { reuniaoId: 'reuniao-1', liveCoachAtivo: false },
};
describe('dados privados na página pública da sala', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createClient.mockResolvedValue('cliente-com-rls');
    obterContextoDaSala.mockResolvedValue(contexto);
    obterContextoCoach.mockResolvedValue({ plano });
  });
  it('carrega o roteiro só para o anfitrião, inclusive sem Live Coach', async () => {
    const pagina = await SalaCallPage({
      params: Promise.resolve({ codigo: 'sala-valida' }),
      searchParams: Promise.resolve({}),
    });
    expect(obterContextoCoach).toHaveBeenCalledWith('cliente-com-rls', 'reuniao-1');
    expect(pagina.props as unknown).toEqual(expect.objectContaining({ planoAnfitriao: plano }));
  });
  it.each([null, 'outro-usuario'])(
    'não lê nem serializa o roteiro para convidado %s',
    async (usuarioId) => {
      obterContextoDaSala.mockResolvedValue({ ...contexto, anfitriao: false, usuarioId });
      const pagina = await SalaCallPage({
        params: Promise.resolve({ codigo: 'sala-valida' }),
        searchParams: Promise.resolve({}),
      });
      expect(obterContextoCoach).not.toHaveBeenCalled();
      expect(createClient).not.toHaveBeenCalled();
      expect(pagina.props as unknown).toEqual(expect.objectContaining({ planoAnfitriao: null }));
      expect(JSON.stringify(pagina.props)).not.toContain('Cliente confidencial');
      expect(JSON.stringify(pagina.props)).not.toContain(plano.perguntas[0]!.pergunta);
    },
  );
  it('não busca dados do cliente para um código inválido', async () => {
    obterContextoDaSala.mockResolvedValue(null);
    await expect(
      SalaCallPage({
        params: Promise.resolve({ codigo: 'invalido' }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow('not-found');
    expect(obterContextoCoach).not.toHaveBeenCalled();
  });
});
