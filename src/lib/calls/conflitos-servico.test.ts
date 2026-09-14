import { describe, expect, it, vi } from 'vitest';
import type { createClient } from '@/lib/supabase/server';
vi.mock('server-only', () => ({}));
import { conferirHorario } from './conflitos-servico';
import { conflitoDoHorario } from './conflitos-modelo';

const horario = { inicio: '2099-10-10T15:00:00.000Z', duracao: 45 };
const linha = {
  id: '11111111-1111-4111-8111-111111111111',
  titulo: 'Descoberta com Aurora',
  agendada_para: horario.inicio,
  duracao_minutos: 45,
  total: 1,
  versao: 'a'.repeat(32),
};
function banco(data: unknown = [linha], error: unknown = null) {
  const rpc = vi.fn().mockResolvedValue({ data, error });
  return { rpc, cliente: { rpc } as unknown as Awaited<ReturnType<typeof createClient>> };
}
describe('conferirHorario', () => {
  it('retorna o intervalo e apenas os dados necessários para decidir', async () => {
    const { cliente, rpc } = banco();
    const { conflito } = await conferirHorario(cliente, { ...horario, ignorar: linha.id });
    expect(rpc).toHaveBeenCalledWith('calls_conferir_horario', {
      p_inicio: horario.inicio,
      p_duracao_minutos: 45,
      p_ignorar: linha.id,
    });
    expect(conflito?.reunioes).toEqual([
      { id: linha.id, titulo: linha.titulo, inicio: horario.inicio, duracao: 45 },
    ]);
    expect(conflito?.confirmacao).toMatch(/^[a-f0-9]{64}$/);
  });
  it('permite continuar sem conflito', async () => {
    expect(await conferirHorario(banco([]).cliente, horario)).toEqual({});
  });
  it('exige a confirmação do resultado atual, com nova leitura', async () => {
    const { cliente, rpc } = banco();
    const { conflito } = await conferirHorario(cliente, horario);
    expect(
      await conferirHorario(cliente, { ...horario, confirmacao: conflito!.confirmacao }),
    ).toEqual({});
    expect(rpc).toHaveBeenCalledTimes(2);
    expect(
      (await conferirHorario(cliente, { ...horario, confirmacao: 'on' })).conflito,
    ).toBeDefined();
  });
  it.each([{ inicio: '2099-10-10T15:15:00.000Z' }, { duracao: 60 }, { ignorar: linha.id }])(
    'invalida confirmação ao mudar parâmetros %o',
    async (mudanca) => {
      const { cliente } = banco();
      const { conflito } = await conferirHorario(cliente, horario);
      expect(
        (
          await conferirHorario(cliente, {
            ...horario,
            ...mudanca,
            confirmacao: conflito!.confirmacao,
          })
        ).conflito,
      ).toBeDefined();
    },
  );
  it('requer nova confirmação quando outro conflito mudou, mesmo fora dos cinco visíveis', async () => {
    const { conflito } = await conferirHorario(banco([{ ...linha, total: 9 }]).cliente, horario);
    const atual = banco([{ ...linha, total: 9, versao: 'b'.repeat(32) }]);
    expect(
      (await conferirHorario(atual.cliente, { ...horario, confirmacao: conflito!.confirmacao }))
        .conflito,
    ).toBeDefined();
  });
  it.each([null, {}, [{ ...linha, id: 'invalido' }]])(
    'não interpreta resposta inválida como agenda livre',
    async (data) => {
      expect((await conferirHorario(banco(data).cliente, horario)).erro).toContain(
        'Nada foi alterado',
      );
    },
  );
  it('falha de consulta ou transporte não autoriza prosseguir nem expõe erro interno', async () => {
    expect(
      (await conferirHorario(banco([], { message: 'segredo' }).cliente, horario)).erro,
    ).not.toContain('segredo');
    const { cliente, rpc } = banco();
    rpc.mockRejectedValue(new Error('segredo'));
    expect((await conferirHorario(cliente, horario)).erro).toContain('Tente novamente');
  });
  it('só apresenta o aviso que corresponde aos campos atuais', async () => {
    const { conflito } = await conferirHorario(banco().cliente, horario);
    const data = new Date(horario.inicio);
    const local = new Date(data.getTime() - data.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 16);
    expect(conflitoDoHorario(conflito, local, '45')).toEqual(conflito);
    expect(conflitoDoHorario(conflito, local, '60')).toBeUndefined();
    expect(conflitoDoHorario(conflito, '', '45')).toBeUndefined();
  });
});
