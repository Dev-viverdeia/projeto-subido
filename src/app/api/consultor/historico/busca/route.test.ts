import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('@/lib/consultor/busca-global-queries', () => ({ buscarMensagensHistorico: vi.fn() }));
import { buscarMensagensHistorico } from '@/lib/consultor/busca-global-queries';
import { GET } from './route';
const dono = '11111111-1111-4111-8111-111111111111';
const url = `http://localhost/api/consultor/historico/busca?dono=${dono}&busca=Escopo`;
beforeEach(() => {
  vi.mocked(buscarMensagensHistorico).mockReset();
});
it('valida entrada antes de consultar e aplica no-store inclusive nos erros', async () => {
  for (const u of [
    url + '&pagina=-1',
    url.replace('busca=Escopo', 'busca=a'),
    url.replace(dono, 'erro'),
  ]) {
    const res = await GET(new Request(u));
    expect(res.status).toBe(400);
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
  }
  expect(buscarMensagensHistorico).not.toHaveBeenCalled();
});
it('recusa troca de conta sem conteúdo em cache', async () => {
  vi.mocked(buscarMensagensHistorico).mockResolvedValue(null);
  const res = await GET(new Request(url));
  expect(res.status).toBe(401);
  expect(res.headers.get('Cache-Control')).toBe('private, no-store');
});
it('retorna página privada sem exigir conversa conhecida', async () => {
  const dados = { mensagens: [], mais: false };
  vi.mocked(buscarMensagensHistorico).mockResolvedValue(dados);
  const res = await GET(new Request(url + '&pagina=2'));
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual(dados);
  expect(res.headers.get('Cache-Control')).toBe('private, no-store');
  expect(buscarMensagensHistorico).toHaveBeenCalledWith(dono, 'Escopo', 2);
});
it('não expõe detalhes do banco quando falha', async () => {
  vi.mocked(buscarMensagensHistorico).mockRejectedValue(new Error('SEGREDO'));
  const res = await GET(new Request(url));
  expect(res.status).toBe(503);
  expect(await res.text()).not.toContain('SEGREDO');
});
