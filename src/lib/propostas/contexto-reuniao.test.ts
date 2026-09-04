import { beforeEach, describe, expect, it, vi } from 'vitest';

const { obterUltimaDescobertaConcluida, obterPosCall } = vi.hoisted(() => ({
  obterUltimaDescobertaConcluida: vi.fn(),
  obterPosCall: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/calls/descoberta', () => ({ obterUltimaDescobertaConcluida }));
vi.mock('@/lib/calls/queries', () => ({ obterPosCall }));
import { resolverReuniaoProposta } from './contexto-reuniao';

const cliente = '11111111-1111-4111-8111-111111111111';
const reuniao = '22222222-2222-4222-8222-222222222222';
const contexto = {
  oportunidade: { id: cliente },
  reuniao: { id: reuniao, status: 'concluida', tipo: 'descoberta' },
};

describe('resolverReuniaoProposta', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    obterUltimaDescobertaConcluida.mockResolvedValue(reuniao);
    obterPosCall.mockResolvedValue(contexto);
  });
  it('aproveita a última descoberta ao entrar pela ficha ou pela biblioteca', async () => {
    expect(await resolverReuniaoProposta(cliente)).toEqual(contexto);
    expect(obterUltimaDescobertaConcluida).toHaveBeenCalledWith(cliente);
    expect(obterPosCall).toHaveBeenCalledWith(reuniao);
  });
  it('respeita a reunião comercial selecionada', async () => {
    obterPosCall.mockResolvedValue({
      ...contexto,
      reuniao: { ...contexto.reuniao, tipo: 'follow_up' },
    });
    expect(await resolverReuniaoProposta(cliente, reuniao)).not.toBeNull();
    expect(obterUltimaDescobertaConcluida).not.toHaveBeenCalled();
  });
  it('não usa contexto de outro cliente nem busca um substituto silenciosamente', async () => {
    obterPosCall.mockResolvedValue({ ...contexto, oportunidade: { id: 'outro-cliente' } });
    expect(await resolverReuniaoProposta(cliente, reuniao)).toBeNull();
    expect(obterUltimaDescobertaConcluida).not.toHaveBeenCalled();
  });
  it.each([
    ['agendada', 'descoberta'],
    ['cancelada', 'descoberta'],
    ['processando', 'descoberta'],
    ['concluida', 'kickoff'],
    ['concluida', 'entrega'],
  ])('não importa uma reunião %s de tipo %s', async (status, tipo) => {
    obterPosCall.mockResolvedValue({ ...contexto, reuniao: { ...contexto.reuniao, status, tipo } });
    expect(await resolverReuniaoProposta(cliente, reuniao)).toBeNull();
  });
  it('recusa identificadores inválidos antes de consultar dados', async () => {
    expect(await resolverReuniaoProposta('invalido', reuniao)).toBeNull();
    expect(await resolverReuniaoProposta(cliente, 'invalido')).toBeNull();
    expect(obterPosCall).not.toHaveBeenCalled();
    expect(obterUltimaDescobertaConcluida).not.toHaveBeenCalled();
  });
  it('lida com descoberta ausente ou reunião removida', async () => {
    obterUltimaDescobertaConcluida.mockResolvedValue(null);
    expect(await resolverReuniaoProposta(cliente)).toBeNull();
    obterPosCall.mockResolvedValue(null);
    expect(await resolverReuniaoProposta(cliente, reuniao)).toBeNull();
  });
});
