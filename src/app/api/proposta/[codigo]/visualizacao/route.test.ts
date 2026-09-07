// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const { registrar } = vi.hoisted(() => ({ registrar: vi.fn() }));
vi.mock('@/lib/propostas/portal', () => ({ registrarVisualizacaoProposta: registrar }));
import { POST } from './route';
const codigo = '11111111-1111-4111-8111-111111111111';
const path = `/api/proposta/${codigo}/visualizacao`;
beforeEach(() => vi.resetAllMocks());
it('marcador de visualização volta ao endpoint correto e evita contagem duplicada', async () => {
  registrar.mockResolvedValue(true);
  const response = await POST(
    new NextRequest(`https://subido.viverdeia.ai${path}`, { method: 'POST' }),
    { params: Promise.resolve({ codigo }) },
  );
  const cookie = response.headers.get('set-cookie')!;
  expect(cookie).toContain(`Path=${path}`);
  const segunda = await POST(
    new NextRequest(`https://subido.viverdeia.ai${path}`, {
      method: 'POST',
      headers: { cookie: cookie.split(';')[0]! },
    }),
    { params: Promise.resolve({ codigo }) },
  );
  expect(segunda.status).toBe(204);
  expect(registrar).toHaveBeenCalledOnce();
});
