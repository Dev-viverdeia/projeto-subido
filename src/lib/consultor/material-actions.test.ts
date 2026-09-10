import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
const { create, from, getUser, rpc } = vi.hoisted(() => ({
  create: vi.fn(),
  from: vi.fn(),
  getUser: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock('@/lib/supabase/server', () => ({ createClient: create }));
import { revalidatePath } from 'next/cache';
import { prepararRevisaoMaterial, salvarResumoMaterial } from './material-actions';
const dono = '11111111-1111-4111-8111-111111111111';
const mensagem = '33333333-3333-4333-8333-333333333333';
const resumo = {
  titulo: 'Reunião inicial',
  escopo: 'Atendimento com IA.',
  decisoes: '',
  tarefas: '',
  pendencias: 'Validar preço.',
};
const entrada = { ...resumo, mensagem, oportunidade: dono, revisado: 'sim' };
const salvo = { id: mensagem, oportunidade: dono, salvoEm: '2026-09-10T12:00:00Z' };
let q: Record<'select' | 'eq' | 'maybeSingle' | 'order' | 'limit', ReturnType<typeof vi.fn>>;
beforeEach(() => {
  vi.clearAllMocks();
  q = Object.fromEntries(
    ['select', 'eq', 'maybeSingle', 'order', 'limit'].map((m) => [m, vi.fn()]),
  ) as typeof q;
  Object.values(q).forEach((fn) => fn.mockReturnValue(q));
  q.maybeSingle
    .mockResolvedValueOnce({
      data: {
        direcao: {
          material: { resumo, fontes: [{ id: dono, nome: 'reuniao.pdf' }], oportunidade: dono },
        },
      },
    })
    .mockResolvedValue({ data: null });
  q.limit.mockResolvedValue({
    data: [
      { id: dono, titulo: 'Projeto de atendimento', crm_empresas: { nome: 'Clínica exemplo' } },
    ],
  });
  getUser.mockResolvedValue({
    data: { user: { id: dono, app_metadata: { plano_subido: 'pro' } } },
  });
  from.mockReturnValue(q);
  rpc.mockResolvedValue({ data: salvo, error: null });
  create.mockResolvedValue({ auth: { getUser }, from, rpc });
});
it('nega entrada inválida sem acesso ao banco', async () => {
  expect(await salvarResumoMaterial({ ...entrada, revisado: false })).toHaveProperty('erro');
  expect(await prepararRevisaoMaterial('x')).toHaveProperty('erro');
  expect(create).not.toHaveBeenCalled();
});
it('exige sessão e plano atual para ler e gravar', async () => {
  getUser.mockResolvedValue({ data: { user: null } });
  expect(await prepararRevisaoMaterial(mensagem)).toHaveProperty('erro');
  expect(await salvarResumoMaterial(entrada)).toHaveProperty('erro');
  getUser.mockResolvedValue({
    data: { user: { id: dono, app_metadata: { plano_subido: 'starter' } } },
  });
  expect(await prepararRevisaoMaterial(mensagem)).toMatchObject({ plano: true });
  expect(await salvarResumoMaterial(entrada)).toHaveProperty('erro');
  expect(from).not.toHaveBeenCalled();
  expect(rpc).not.toHaveBeenCalled();
});
it('retorna só fichas próprias e recibo mínimo', async () => {
  expect(await prepararRevisaoMaterial(mensagem)).toEqual({
    fichas: [{ id: dono, nome: 'Clínica exemplo', titulo: 'Projeto de atendimento' }],
    salvo: null,
  });
  expect(q.eq).toHaveBeenCalledWith('consultor_threads.dono', dono);
  expect(q.eq).toHaveBeenCalledWith('dono', dono);
  expect(q.eq).toHaveBeenCalledWith('papel', 'consultor');
  expect(q.limit).toHaveBeenCalledWith(300);
});
it('não lista fichas para resposta ausente ou material inválido', async () => {
  q.maybeSingle.mockReset().mockResolvedValue({ data: null });
  expect(await prepararRevisaoMaterial(mensagem)).toHaveProperty('erro');
  expect(q.limit).not.toHaveBeenCalled();
});
it('usa uma única função atômica sem aceitar origem ou dono do navegador', async () => {
  expect(
    await salvarResumoMaterial({ ...entrada, fontes: [{ id: 'inventado' }], dono: 'outro' }),
  ).toEqual({ salvo: { ...salvo, titulo: resumo.titulo } });
  expect(rpc).toHaveBeenCalledExactlyOnceWith('sobral_salvar_material', {
    p_mensagem: mensagem,
    p_oportunidade: dono,
    p_resumo: resumo,
  });
  expect(from).not.toHaveBeenCalled();
  expect(revalidatePath).toHaveBeenCalledWith(`/vendas/${dono}`);
});
it('falha incerta pode ser conferida com a mesma tentativa, sem expor erros internos', async () => {
  rpc.mockResolvedValueOnce({ error: { code: 'PT409', message: 'SEGREDO' } });
  const conflito = await salvarResumoMaterial(entrada);
  expect('erro' in conflito && conflito.erro).toContain('outra revisão');
  rpc.mockRejectedValueOnce(new Error('SEGREDO'));
  const falha = await salvarResumoMaterial(entrada);
  expect('erro' in falha && falha.erro).toContain('conferir');
  expect(revalidatePath).not.toHaveBeenCalled();
});
