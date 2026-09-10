import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('@/lib/consultor/salvas-queries', () => ({ buscarRespostasSalvas: vi.fn() }));
import { buscarRespostasSalvas } from '@/lib/consultor/salvas-queries';
import { GET } from './route';
const dono = '11111111-1111-4111-8111-111111111111';
const url = `http://localhost/api/consultor/salvas?dono=${dono}`;
beforeEach(() => {
  vi.mocked(buscarRespostasSalvas).mockReset();
});
it('valida antes de consultar e não compartilha cache de erros', async () => {
  for (const u of [
    url + '&pagina=-1',
    url + '&busca=' + 'a'.repeat(121),
    url.replace(dono, 'erro'),
  ]) {
    const res = await GET(new Request(u));
    expect(res.status).toBe(400);
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
  }
  expect(buscarRespostasSalvas).not.toHaveBeenCalled();
});
it('recusa sessão diferente e entrega dados autorizados sem cache', async () => {
  vi.mocked(buscarRespostasSalvas).mockResolvedValueOnce(null);
  expect((await GET(new Request(url))).status).toBe(401);
  const dados = { respostas: [], total: 0, mais: false };
  vi.mocked(buscarRespostasSalvas).mockResolvedValue(dados);
  const res = await GET(new Request(url + '&pagina=2&busca=Escopo'));
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual(dados);
  expect(res.headers.get('Cache-Control')).toBe('private, no-store');
  expect(buscarRespostasSalvas).toHaveBeenCalledWith(dono, 'Escopo', 2);
});
it('falha sem detalhes internos', async () => {
  vi.mocked(buscarRespostasSalvas).mockRejectedValue(new Error('SEGREDO'));
  const res = await GET(new Request(url));
  expect(res.status).toBe(503);
  expect(await res.text()).not.toContain('SEGREDO');
});
