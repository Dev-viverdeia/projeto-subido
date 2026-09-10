import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('@/lib/consultor/historico-queries', () => ({ obterHistorico: vi.fn() }));
import { obterHistorico } from '@/lib/consultor/historico-queries';
import { GET } from './route';
const dono = '11111111-1111-4111-8111-111111111111';
beforeEach(() => {
  vi.mocked(obterHistorico).mockReset();
});
it('valida a busca antes de consultar dados', async () => {
  const res = await GET(
    new Request(`http://localhost/api/consultor/conversas?dono=${dono}&pagina=-1`),
  );
  expect(res.status).toBe(400);
  expect(res.headers.get('Cache-Control')).toBe('private, no-store');
  expect(obterHistorico).not.toHaveBeenCalled();
});
it('não devolve histórico com sessão ausente ou diferente', async () => {
  vi.mocked(obterHistorico).mockResolvedValue(null);
  const res = await GET(new Request(`http://localhost/api/consultor/conversas?dono=${dono}`));
  expect(res.status).toBe(401);
  expect(await res.json()).toEqual({ erro: 'Entre novamente na mesma conta.' });
});
it('busca páginas autenticadas sem cache compartilhado', async () => {
  const dados = { threads: [], total: 0, mais: false };
  vi.mocked(obterHistorico).mockResolvedValue(dados);
  const res = await GET(
    new Request(`http://localhost/api/consultor/conversas?dono=${dono}&busca=Projeto&pagina=2`),
  );
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual(dados);
  expect(res.headers.get('Cache-Control')).toBe('private, no-store');
  expect(obterHistorico).toHaveBeenCalledWith('Projeto', 2, dono);
});
it('falha temporária não expõe detalhes internos', async () => {
  vi.mocked(obterHistorico).mockRejectedValue(new Error('private connection info'));
  const res = await GET(new Request(`http://localhost/api/consultor/conversas?dono=${dono}`));
  expect(res.status).toBe(503);
  expect(await res.text()).not.toContain('private connection');
});
