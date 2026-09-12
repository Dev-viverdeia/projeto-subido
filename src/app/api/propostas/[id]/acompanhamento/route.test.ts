import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/planos/server', () => ({ obterAcessoRecurso: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
import { obterAcessoRecurso } from '@/lib/planos/server';
import { createClient } from '@/lib/supabase/server';
import { GET } from './route';
import { AcompanhamentoPropostaSchema } from '@/lib/propostas/acompanhamento';

const id = '11111111-1111-4111-8111-111111111111';
const dono = '22222222-2222-4222-8222-222222222222';
const linha = {
  id,
  status: 'apresentada',
  versao: 2,
  compartilhamento_codigo: id,
  compartilhamento_ativo: true,
  compartilhada_em: null,
  primeira_visualizacao_em: null,
  ultima_visualizacao_em: null,
  visualizacoes: 3,
  decisao_nome: null,
  decisao_email: null,
  decisao_comentario: null,
  decidida_em: null,
};
const consulta = () => {
  const q = { select: vi.fn(), eq: vi.fn(), abortSignal: vi.fn(), maybeSingle: vi.fn() };
  q.select.mockReturnValue(q);
  q.eq.mockReturnValue(q);
  q.abortSignal.mockReturnValue(q);
  return q;
};
const proposta = consulta();
const entrega = consulta();
const getUser = vi.fn();
const from = vi.fn();
const requisitar = (chave = id) =>
  GET(new Request(`https://example.test/api/propostas/${chave}/acompanhamento`), {
    params: Promise.resolve({ id: chave }),
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(obterAcessoRecurso).mockResolvedValue({ permitido: true, plano: 'pro' });
  getUser.mockResolvedValue({ data: { user: { id: dono } } });
  proposta.maybeSingle.mockResolvedValue({ data: linha, error: null });
  entrega.maybeSingle.mockResolvedValue({ data: null, error: null });
  from.mockImplementation((tabela: string) => (tabela === 'propostas' ? proposta : entrega));
  vi.mocked(createClient).mockResolvedValue({ from, auth: { getUser } } as unknown as Awaited<
    ReturnType<typeof createClient>
  >);
});

it('retorna somente metadados privados da proposta do dono autenticado, sem contar visualização', async () => {
  const response = await requisitar();
  expect(response.status).toBe(200);
  expect(response.headers.get('Cache-Control')).toBe('private, no-store, max-age=0');
  const dados = AcompanhamentoPropostaSchema.parse(await response.json());
  expect(dados.compartilhamento.visualizacoes).toBe(3);
  expect(dados).not.toHaveProperty('documento');
  expect(proposta.select).toHaveBeenCalledWith(expect.not.stringContaining('documento'));
  expect(proposta.eq).toHaveBeenCalledWith('id', id);
  expect(proposta.eq).toHaveBeenCalledWith('dono', dono);
  expect(from).toHaveBeenCalledTimes(1);
  expect(proposta.abortSignal).toHaveBeenCalledWith(expect.any(AbortSignal));
});

it('só consulta entrega no aceite e mantém a mesma propriedade/RLS', async () => {
  proposta.maybeSingle.mockResolvedValue({ data: { ...linha, status: 'aceita' }, error: null });
  entrega.maybeSingle.mockResolvedValue({ data: { id: dono }, error: null });
  const response = await requisitar();
  expect(AcompanhamentoPropostaSchema.parse(await response.json()).execucaoId).toBe(dono);
  expect(entrega.eq).toHaveBeenCalledWith('proposta_id', id);
  expect(entrega.eq).toHaveBeenCalledWith('dono', dono);
});

it('rejeita ID inválido antes de acessar dados', async () => {
  expect((await requisitar('invalido')).status).toBe(404);
  expect(obterAcessoRecurso).not.toHaveBeenCalled();
  expect(createClient).not.toHaveBeenCalled();
});

it.each([401, 403])('verifica sessão/plano antes da leitura (%s)', async (status) => {
  vi.mocked(obterAcessoRecurso).mockResolvedValue(
    status === 401
      ? { permitido: false, motivo: 'sessao' }
      : { permitido: false, motivo: 'plano', plano: 'starter' },
  );
  const response = await requisitar();
  expect(response.status).toBe(status);
  expect(response.headers.get('Cache-Control')).toContain('no-store');
  expect(from).not.toHaveBeenCalled();
});

it('não revela existência nem dados de proposta invisível para a sessão', async () => {
  proposta.maybeSingle.mockResolvedValue({ data: null, error: null });
  const response = await requisitar();
  expect(response.status).toBe(404);
  expect(await response.text()).toBe('');
  expect(entrega.maybeSingle).not.toHaveBeenCalled();
});

it('confirma a sessão no cliente request-scoped e não vaza erros do banco', async () => {
  getUser.mockResolvedValueOnce({ data: { user: null } });
  expect((await requisitar()).status).toBe(401);
  expect(from).not.toHaveBeenCalled();
  proposta.maybeSingle.mockResolvedValueOnce({
    data: null,
    error: { message: 'segredo do banco' },
  });
  const response = await requisitar();
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('segredo');
});
