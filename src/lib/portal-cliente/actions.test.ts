import { beforeEach, describe, expect, it, vi } from 'vitest';

const { registrarDecisaoCliente, registrarConclusaoDependenciaCliente } = vi.hoisted(() => ({
  registrarDecisaoCliente: vi.fn(),
  registrarConclusaoDependenciaCliente: vi.fn(),
}));

vi.mock('./servico', () => ({ registrarDecisaoCliente, registrarConclusaoDependenciaCliente }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { concluirPendenciaCliente, decidirEntregaCliente } from './actions';

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
  beforeEach(() => {
    registrarDecisaoCliente.mockReset();
    registrarConclusaoDependenciaCliente.mockReset();
  });

  it('exige um comentário útil quando o cliente pede ajuste', async () => {
    const resultado = await decidirEntregaCliente({}, formulario('ajustes', 'não'));

    expect(resultado.erro).toMatch(/Conte brevemente/i);
    expect(registrarDecisaoCliente).not.toHaveBeenCalled();
  });

  it('registra a aprovação usando somente código e tarefa válidos', async () => {
    registrarDecisaoCliente.mockResolvedValue({ decidiu: true, notificacao: 'enviada' });

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
    registrarDecisaoCliente.mockResolvedValue({ decidiu: true, notificacao: 'enviada' });

    const resultado = await decidirEntregaCliente({}, formulario('aprovada', '', true));

    expect(resultado.sucesso).toMatch(/projeto foi concluído/i);
  });

  it('preserva a decisão quando o aviso por e-mail falha', async () => {
    registrarDecisaoCliente.mockResolvedValue({ decidiu: true, notificacao: 'falhou' });

    const resultado = await decidirEntregaCliente({}, formulario('aprovada'));

    expect(resultado.sucesso).toMatch(/Entrega aprovada/i);
    expect(resultado.aviso).toMatch(/decisão está salva/i);
  });

  it('registra uma pendência concluída pelo portal', async () => {
    registrarConclusaoDependenciaCliente.mockResolvedValue({
      concluiu: true,
      notificacao: 'enviada',
    });
    const dados = new FormData();
    dados.set('codigo', '44444444-4444-4444-8444-444444444444');
    dados.set('acao', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc');

    const resultado = await concluirPendenciaCliente({}, dados);

    expect(resultado.sucesso).toMatch(/foi avisado/i);
    expect(registrarConclusaoDependenciaCliente).toHaveBeenCalledWith({
      codigo: '44444444-4444-4444-8444-444444444444',
      acaoId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    });
  });

  it('preserva a confirmação quando o aviso ao responsável falha', async () => {
    registrarConclusaoDependenciaCliente.mockResolvedValue({
      concluiu: true,
      notificacao: 'falhou',
    });
    const dados = new FormData();
    dados.set('codigo', '44444444-4444-4444-8444-444444444444');
    dados.set('acao', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc');

    const resultado = await concluirPendenciaCliente({}, dados);

    expect(resultado.sucesso).toMatch(/ficou salva/i);
  });
});
