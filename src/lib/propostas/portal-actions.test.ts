import { beforeEach, describe, expect, it, vi } from 'vitest';

const { registrarDecisaoProposta, revalidatePath } = vi.hoisted(() => ({
  registrarDecisaoProposta: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('./portal', () => ({ registrarDecisaoProposta }));
vi.mock('next/cache', () => ({ revalidatePath }));

import { decidirPropostaCliente } from './portal-actions';

const CODIGO = '11111111-1111-4111-8111-111111111111';

function formulario(decisao: 'aceita' | 'recusada') {
  const dados = new FormData();
  dados.set('codigo', CODIGO);
  dados.set('decisao', decisao);
  dados.set('nome', 'Marina Alves');
  dados.set('email', 'marina@empresa.com.br');
  dados.set('comentario', 'Decisão validada com a diretoria.');
  if (decisao === 'aceita') dados.set('aceiteTermos', 'sim');
  return dados;
}

describe('decisão pública da proposta', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registra o aceite e revalida o documento do cliente', async () => {
    registrarDecisaoProposta.mockResolvedValue({
      proposta_id: '22222222-2222-4222-8222-222222222222',
      projeto_id: '33333333-3333-4333-8333-333333333333',
      status: 'aceita',
    });

    const resultado = await decidirPropostaCliente({}, formulario('aceita'));

    expect(resultado).toMatchObject({ status: 'aceita' });
    expect(registrarDecisaoProposta).toHaveBeenCalledWith({
      codigo: CODIGO,
      decisao: 'aceita',
      nome: 'Marina Alves',
      email: 'marina@empresa.com.br',
      comentario: 'Decisão validada com a diretoria.',
      aceiteTermos: true,
    });
    expect(revalidatePath).toHaveBeenCalledWith(`/proposta/${CODIGO}`);
  });

  it('rejeita dados incompletos antes de acessar o banco', async () => {
    const dados = formulario('aceita');
    dados.set('email', 'email-invalido');

    const resultado = await decidirPropostaCliente({}, dados);

    expect(resultado.erro).toContain('e-mail válido');
    expect(registrarDecisaoProposta).not.toHaveBeenCalled();
  });

  it('não aprova sem registrar o aceite da versão', async () => {
    const dados = formulario('aceita');
    dados.delete('aceiteTermos');

    const resultado = await decidirPropostaCliente({}, dados);

    expect(resultado.erro).toContain('leu e concorda');
    expect(registrarDecisaoProposta).not.toHaveBeenCalled();
  });

  it('impede uma segunda decisão para o mesmo link', async () => {
    registrarDecisaoProposta.mockResolvedValue(null);

    const resultado = await decidirPropostaCliente({}, formulario('recusada'));

    expect(resultado.erro).toContain('já recebeu uma decisão');
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
