import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('@/lib/consultor/arquivos-conversa-queries', () => ({ obterArquivosConversa: vi.fn() }));
import { obterArquivosConversa } from '@/lib/consultor/arquivos-conversa-queries';
import { GET } from './route';
const dono = '11111111-1111-4111-8111-111111111111';
const conversa = '33333333-3333-4333-8333-333333333333';
const url = `http://localhost/api/consultor/arquivos?dono=${dono}&conversa=${conversa}`;
beforeEach(() => {
  vi.mocked(obterArquivosConversa).mockReset();
});
it('valida os parâmetros antes de consultar', async () => {
  const res = await GET(new Request(`${url}&pagina=-1`));
  expect(res.status).toBe(400);
  expect(res.headers.get('Cache-Control')).toBe('private, no-store');
  expect(obterArquivosConversa).not.toHaveBeenCalled();
});
it('recusa sessão ausente ou diferente', async () => {
  vi.mocked(obterArquivosConversa).mockResolvedValue(null);
  expect((await GET(new Request(url))).status).toBe(401);
});
it('devolve somente a página autorizada, sem cache compartilhado', async () => {
  const dados = { arquivos: [], total: 0, mais: false };
  vi.mocked(obterArquivosConversa).mockResolvedValue(dados);
  const res = await GET(new Request(`${url}&busca=Plano&pagina=2`));
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual(dados);
  expect(res.headers.get('Cache-Control')).toBe('private, no-store');
  expect(obterArquivosConversa).toHaveBeenCalledWith(conversa, dono, 'Plano', 2);
});
it('não expõe detalhes de erros internos', async () => {
  vi.mocked(obterArquivosConversa).mockRejectedValue(new Error('SEGREDO'));
  const res = await GET(new Request(url));
  expect(res.status).toBe(503);
  expect(await res.text()).not.toContain('SEGREDO');
});
