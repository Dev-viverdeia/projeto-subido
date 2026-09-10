import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('@/lib/consultor/busca-mensagens-queries', () => ({ buscarMensagensConversa: vi.fn() }));
import { buscarMensagensConversa } from '@/lib/consultor/busca-mensagens-queries';
import { GET } from './route';
const dono = '11111111-1111-4111-8111-111111111111';
const conversa = '33333333-3333-4333-8333-333333333333';
const url = `http://localhost/api/consultor/mensagens/busca?dono=${dono}&conversa=${conversa}&busca=Escopo`;
beforeEach(() => {
  vi.mocked(buscarMensagensConversa).mockReset();
});
it('valida antes de consultar e não compartilha cache de erros', async () => {
  for (const u of [
    url + '&pagina=-1',
    url.replace('busca=Escopo', 'busca=a'),
    url.replace(dono, 'erro'),
  ]) {
    const res = await GET(new Request(u));
    expect(res.status).toBe(400);
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
  }
  expect(buscarMensagensConversa).not.toHaveBeenCalled();
});
it('recusa sessão diferente', async () => {
  vi.mocked(buscarMensagensConversa).mockResolvedValue(null);
  expect((await GET(new Request(url))).status).toBe(401);
});
it('entrega somente resultados autorizados com paginação e sem cache', async () => {
  const dados = { mensagens: [], total: 0, mais: false };
  vi.mocked(buscarMensagensConversa).mockResolvedValue(dados);
  const res = await GET(new Request(url + '&pagina=2'));
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual(dados);
  expect(res.headers.get('Cache-Control')).toBe('private, no-store');
  expect(buscarMensagensConversa).toHaveBeenCalledWith(conversa, dono, 'Escopo', 2);
});
it('falha sem detalhes internos', async () => {
  vi.mocked(buscarMensagensConversa).mockRejectedValue(new Error('SEGREDO'));
  const res = await GET(new Request(url));
  expect(res.status).toBe(503);
  expect(await res.text()).not.toContain('SEGREDO');
});
