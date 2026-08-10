import { beforeEach, describe, expect, it, vi } from 'vitest';

const { registrarDecisaoCliente } = vi.hoisted(() => ({ registrarDecisaoCliente: vi.fn() }));

vi.mock('./servico', () => ({ registrarDecisaoCliente }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { decidirEntregaCliente } from './actions';

function formulario(decisao: 'aprovada' | 'ajustes', comentario = '', final = false) {
  const dados = new FormData();
  dados.set('codigo', '44444444-4444-4444-8444-444444444444');
  dados.set('tarefa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1');
  dados.set('decisao', decisao);
  dados.set('comentario', comentario);
  dados.set('final', final ? 'sim' : 'nao');
  return dados;
}

describe('decidirEntregaCliente', () => {
  beforeEach(() => registrarDecisaoCliente.mockReset());

  it('exige um comentário útil quando o cliente pede ajuste', async () => {
    const resultado = await decidirEntregaCliente({}, formulario('ajustes', 'não'));

    expect(resultado.erro).toMatch(/Conte brevemente/i);
    expect(registrarDecisaoCliente).not.toHaveBeenCalled();
  });

  it('registra a aprovação usando somente código e tarefa válidos', async () => {
    registrarDecisaoCliente.mockResolvedValue(true);

    const resultado = await decidirEntregaCliente({}, formulario('aprovada'));

    expect(resultado.sucesso).toMatch(/Entrega aprovada/i);
    expect(registrarDecisaoCliente).toHaveBeenCalledWith({
      codigo: '44444444-4444-4444-8444-444444444444',
      tarefaId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      decisao: 'aprovada',
      comentario: null,
    });
  });

  it('confirma o encerramento quando o aceite é o último do projeto', async () => {
    registrarDecisaoCliente.mockResolvedValue(true);

    const resultado = await decidirEntregaCliente({}, formulario('aprovada', '', true));

    expect(resultado.sucesso).toMatch(/projeto foi concluído/i);
  });
});
