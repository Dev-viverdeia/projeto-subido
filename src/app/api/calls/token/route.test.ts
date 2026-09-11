// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { z } from 'zod';
const mocks = vi.hoisted(() => ({ contexto: vi.fn(), registrar: vi.fn() }));
vi.mock('@/lib/calls/queries', () => ({ obterContextoDaSala: mocks.contexto }));
vi.mock('@/lib/calls/admin', () => ({ registrarEntradaNaSala: mocks.registrar }));
vi.mock('@/lib/env', () => ({
  livekitEnv: () => ({
    LIVEKIT_URL: 'wss://example.test',
    LIVEKIT_API_KEY: 'key',
    LIVEKIT_API_SECRET: 'segredo-sintetico-de-teste',
  }),
}));
import { POST } from './route';
async function identidadeDaResposta(r: Response) {
  const body = z.object({ participant_token: z.string() }).parse(await r.json());
  return z
    .object({ sub: z.string() })
    .parse(JSON.parse(Buffer.from(body.participant_token.split('.')[1]!, 'base64url').toString()))
    .sub;
}
const codigo = '44444444-4444-4444-8444-444444444444';
const nomeCookie = `subido_call_${codigo.replaceAll('-', '')}`;
const convidado = {
  anfitriao: false,
  dono: 'dono',
  usuarioId: null,
  convite: { status: 'agendada', disponivel: true, reuniaoId: 'reuniao', salaProvedor: 'sala' },
};
const enviar = (cookie?: string) =>
  POST(
    new NextRequest('https://subido.viverdeia.ai/api/calls/token', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(cookie ? { cookie: `${nomeCookie}=${cookie}` } : {}),
      },
      body: JSON.stringify({ codigo, nome: 'Convidado', consentiu: true }),
    }),
  );
beforeEach(() => {
  vi.clearAllMocks();
  mocks.contexto.mockResolvedValue(convidado);
  mocks.registrar.mockResolvedValue(undefined);
});
it('token emitido não aceita UUID público e reconexão assinada preserva sub', async () => {
  const publico = '7b59a684-30b9-455d-962f-4a00c63b04bd';
  const r = await enviar(publico);
  const sub = await identidadeDaResposta(r);
  expect(sub).not.toBe(`guest-${publico}`);
  const cookie = r.cookies.get(nomeCookie)!.value;
  expect(await identidadeDaResposta(await enviar(cookie))).toBe(sub);
  expect(mocks.registrar).toHaveBeenLastCalledWith(expect.objectContaining({ identidade: sub }));
});
it('anfitrião continua autenticado e sala encerrada durante entrada não emite token', async () => {
  mocks.contexto.mockResolvedValue({ ...convidado, anfitriao: true, usuarioId: 'usuario' });
  const r = await enviar();
  expect(await identidadeDaResposta(r)).toBe('host-usuario');
  expect(r.cookies.get(nomeCookie)).toBeUndefined();
  mocks.registrar.mockRejectedValue(new Error('sala encerrada'));
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    expect((await enviar()).status).toBe(409);
  } finally {
    log.mockRestore();
  }
});
