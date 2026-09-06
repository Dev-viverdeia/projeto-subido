import { beforeEach, describe, expect, it, vi } from 'vitest';
const { getClaims, executar, revalidar } = vi.hoisted(() => ({
  getClaims: vi.fn(),
  executar: vi.fn(),
  revalidar: vi.fn(),
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve({ auth: { getClaims } }),
}));
vi.mock('@/lib/calls/agenda-servico', () => ({ executarAlteracaoAgenda: executar }));
vi.mock('next/cache', () => ({ revalidatePath: revalidar }));
vi.mock('@/lib/consultor/revalidacao', () => ({ revalidarDirecaoOperacional: vi.fn() }));
import { alterarAgendaReuniao } from './agenda-actions';
function formulario() {
  const form = new FormData();
  for (const [campo, valor] of Object.entries({
    reuniao: '11111111-1111-4111-8111-111111111111',
    acao: 'reagendar',
    versao: '2026-09-05T12:00:00Z',
    agendadaPara: '2099-10-10T15:00',
    duracao: '45',
    offsetMinutos: '180',
    dono: 'atacante',
  }))
    form.set(campo, valor);
  return form;
}
beforeEach(() => {
  vi.clearAllMocks();
  executar.mockResolvedValue({ status: 'concluido' });
  getClaims.mockResolvedValue({ data: { claims: { sub: 'dono-autenticado' } } });
});
describe('fronteira de alteração da reunião', () => {
  it('usa o dono autenticado, converte o horário e atualiza a ficha', async () => {
    expect((await alterarAgendaReuniao({ status: 'erro' }, formulario())).status).toBe('concluido');
    expect(executar).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        dono: 'dono-autenticado',
        agendadaPara: '2099-10-10T18:00:00.000Z',
        duracaoMinutos: 45,
      }),
    );
    expect(revalidar).toHaveBeenCalledWith('/reunioes/11111111-1111-4111-8111-111111111111');
  });
  it('rejeita data impossível sem chamar o Google', async () => {
    const form = formulario();
    form.set('agendadaPara', '2099-02-30T15:00');
    expect((await alterarAgendaReuniao({ status: 'erro' }, form)).status).toBe('erro');
    expect(executar).not.toHaveBeenCalled();
  });
  it('não altera agenda sem sessão', async () => {
    getClaims.mockResolvedValue({ data: null });
    expect((await alterarAgendaReuniao({ status: 'erro' }, formulario())).mensagem).toContain(
      'sessão expirou',
    );
    expect(executar).not.toHaveBeenCalled();
  });
});
