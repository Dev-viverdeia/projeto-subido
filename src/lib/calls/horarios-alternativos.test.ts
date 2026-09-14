import { describe, expect, it, vi } from 'vitest';
import type { createClient } from '@/lib/supabase/server';
vi.mock('server-only', () => ({}));
import { buscarHorariosAlternativos } from './horarios-alternativos';
import { conferirHorario } from './conflitos-servico';

const dados = {
  inicio: '2099-10-12T09:00:00.000Z',
  duracao: 45,
  fuso: 'UTC',
  ignorar: '11111111-1111-4111-8111-111111111111',
};
const linhas = [{ inicio: '2099-10-12T10:00:00+00:00' }, { inicio: '2099-10-12T10:30:00+00:00' }];
function banco(data: unknown = linhas) {
  const rpc = vi.fn().mockResolvedValue({ data, error: null });
  return { rpc, cliente: { rpc } as unknown as Awaited<ReturnType<typeof createClient>> };
}
describe('horários alternativos', () => {
  it('consulta somente a janela com fuso e reunião excluída; retorna apenas instantes', async () => {
    const { cliente, rpc } = banco();
    expect(await buscarHorariosAlternativos(cliente, dados)).toEqual([
      '2099-10-12T10:00:00.000Z',
      '2099-10-12T10:30:00.000Z',
    ]);
    expect(rpc).toHaveBeenCalledWith('calls_sugerir_horarios', {
      p_inicio: dados.inicio,
      p_duracao_minutos: 45,
      p_fuso: 'UTC',
      p_ignorar: dados.ignorar,
    });
  });
  it('distingue agenda sem opções de consulta indisponível', async () => {
    expect(await buscarHorariosAlternativos(banco([]).cliente, dados)).toEqual([]);
    expect(await buscarHorariosAlternativos(banco(null).cliente, dados)).toBeUndefined();
  });
  it.each(['', 'invalido', 'x'.repeat(101)])('não consulta com fuso inválido %s', async (fuso) => {
    const { cliente, rpc } = banco();
    expect(await buscarHorariosAlternativos(cliente, { ...dados, fuso })).toBeUndefined();
    expect(rpc).not.toHaveBeenCalled();
  });
  it.each(
    [
      {},
      [{ inicio: 'invalido' }],
      [...linhas, ...linhas],
      [linhas[0], linhas[0]],
      [{ inicio: dados.inicio }],
      [...linhas].reverse(),
    ].map((resposta) => ({ resposta })),
  )('rejeita resposta inválida ou fora de ordem $resposta', async ({ resposta }) => {
    expect(await buscarHorariosAlternativos(banco(resposta).cliente, dados)).toBeUndefined();
  });
  it('falha de transporte não vaza detalhes', async () => {
    const { cliente, rpc } = banco();
    rpc.mockRejectedValue(new Error('dado privado'));
    expect(await buscarHorariosAlternativos(cliente, dados)).toBeUndefined();
  });
  it('busca opções só no conflito, não no horário livre nem no aceite atual', async () => {
    const { cliente, rpc } = banco([]);
    expect(await conferirHorario(cliente, dados)).toEqual({});
    expect(rpc).toHaveBeenCalledTimes(1);
    rpc.mockImplementation((nome: string) =>
      Promise.resolve({
        data:
          nome === 'calls_conferir_horario'
            ? [
                {
                  id: dados.ignorar,
                  titulo: 'Existente',
                  agendada_para: dados.inicio,
                  duracao_minutos: 45,
                  total: 1,
                  versao: 'a'.repeat(32),
                },
              ]
            : linhas,
        error: null,
      }),
    );
    const resposta = await conferirHorario(cliente, dados);
    expect(resposta.conflito?.alternativas).toHaveLength(2);
    rpc.mockClear();
    expect(
      await conferirHorario(cliente, { ...dados, confirmacao: resposta.conflito!.confirmacao }),
    ).toEqual({});
    expect(rpc).toHaveBeenCalledTimes(1);
  });
  it('mantém o conflito se a consulta de alternativas falhar', async () => {
    const { cliente, rpc } = banco();
    rpc
      .mockResolvedValueOnce({
        data: [
          {
            id: dados.ignorar,
            titulo: 'Existente',
            agendada_para: dados.inicio,
            duracao_minutos: 45,
            total: 1,
            versao: 'a'.repeat(32),
          },
        ],
        error: null,
      })
      .mockRejectedValueOnce(new Error('falha'));
    const resposta = await conferirHorario(cliente, dados);
    expect(resposta.conflito?.total).toBe(1);
    expect(resposta.conflito?.alternativas).toBeUndefined();
  });
});
